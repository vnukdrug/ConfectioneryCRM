using Confectionery.App.DTOs;
using Confectionery.Data;
using Confectionery.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Confectionery.App.Controllers;

[Route("api/[controller]")]
[Authorize]
[ApiController]
public class StockController : ControllerBase
{
    private readonly AppDbContext _context;

    public StockController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("balances")]
    public async Task<ActionResult<IEnumerable<StockBalanceDto>>> GetStockBalances([FromQuery] int? filialId)
    {
        var query = _context.StockBalances
            .Include(sb => sb.Filial)
            .Include(sb => sb.Product)
            .ThenInclude(p => p.Category)
            .AsQueryable();

        if (filialId.HasValue)
        {
            query = query.Where(sb => sb.FilialId == filialId);
        }

        var balances = await query
            .Select(sb => new StockBalanceDto
            {
                Id = sb.Id,
                ProductId = sb.ProductId,  
                Filial = sb.Filial.Name,
                Product = sb.Product.Name,
                Category = sb.Product.Category.Name,
                CategoryType = sb.Product.Category.Type,
                Quantity = sb.Quantity,
                Unit = sb.Product.Unit,
                MinStock = sb.Product.MinStock
            })
            .ToListAsync();

        return Ok(balances);
    }

    [HttpGet("products")]
    public async Task<ActionResult<IEnumerable<object>>> GetProducts()
    {
        var products = await _context.Products
            .Include(p => p.Category)
            .Select(p => new
            {
                p.Id,
                p.Name,
                Category = p.Category.Name,
                CategoryType = p.Category.Type,
                p.Unit,
                p.MinStock
            })
            .ToListAsync();

        return Ok(products);
    }

    [HttpPost("movement")]
    public async Task<ActionResult> CreateMovement(CreateStockMovementDto dto)
    {
        Console.WriteLine($"=== НАЧАЛО СОЗДАНИЯ ДВИЖЕНИЯ ===");
        Console.WriteLine($"FilialId: {dto.FilialId}");
        Console.WriteLine($"ProductId: {dto.ProductId}");
        Console.WriteLine($"Quantity: {dto.Quantity}");
        Console.WriteLine($"MovementType: {dto.MovementType}");
        Console.WriteLine($"Reason: {dto.Reason}");
        Console.WriteLine($"Description: {dto.Description}");

        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // Проверяем существование филиала
            var filial = await _context.Filials.FindAsync(dto.FilialId);
            if (filial == null)
            {
                Console.WriteLine($"❌ Филиал с ID {dto.FilialId} не найден");
                return BadRequest(new { message = "Филиал не найден" });
            }
            Console.WriteLine($"✅ Филиал найден: {filial.Name}");

            // Проверяем существование товара
            var product = await _context.Products.FindAsync(dto.ProductId);
            if (product == null)
            {
                Console.WriteLine($"❌ Товар с ID {dto.ProductId} не найден");
                return BadRequest(new { message = "Товар не найден" });
            }
            Console.WriteLine($"✅ Товар найден: {product.Name}");

            // Получаем ID пользователя из токена
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");
            int userId = 1;
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int parsedUserId))
            {
                userId = parsedUserId;
            }
            Console.WriteLine($"👤 UserId: {userId}");

            // Находим или создаем остаток
            var balance = await _context.StockBalances
                .FirstOrDefaultAsync(sb => sb.FilialId == dto.FilialId && sb.ProductId == dto.ProductId);

            if (balance == null)
            {
                Console.WriteLine($"📦 Остаток не найден, создаем новый");
                balance = new StockBalance
                {
                    FilialId = dto.FilialId,
                    ProductId = dto.ProductId,
                    Quantity = 0
                };
                _context.StockBalances.Add(balance);
            }
            else
            {
                Console.WriteLine($"📦 Текущий остаток: {balance.Quantity}");
            }

            // Обновляем количество
            var oldQuantity = balance.Quantity;
            balance.Quantity += dto.Quantity;
            Console.WriteLine($"📦 Было: {oldQuantity}, стало: {balance.Quantity}");

            // Проверка на отрицательный остаток
            if (balance.Quantity < 0)
            {
                Console.WriteLine($"❌ Ошибка: недостаточно товара! Попытка списать {Math.Abs(dto.Quantity)}, доступно {oldQuantity}");
                await transaction.RollbackAsync();
                return BadRequest(new { message = "Недостаточно товара на складе" });
            }

            // Сохраняем движение
            var movement = new StockMovement
            {
                FilialId = dto.FilialId,
                ProductId = dto.ProductId,
                Quantity = dto.Quantity,
                MovementType = dto.MovementType,
                Reason = dto.Reason,
                Description = dto.Description,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = userId
            };
            _context.StockMovements.Add(movement);
            Console.WriteLine($"📝 Движение добавлено");

            await _context.SaveChangesAsync();
            Console.WriteLine($"💾 Изменения сохранены");

            await transaction.CommitAsync();
            Console.WriteLine($"✅ Транзакция подтверждена");

            return Ok(new { message = "Движение товара успешно зарегистрировано" });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            Console.WriteLine($"❌ ОШИБКА: {ex.Message}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"❌ Inner Exception: {ex.InnerException.Message}");
                Console.WriteLine($"❌ Stack Trace: {ex.InnerException.StackTrace}");
            }
            return StatusCode(500, new { message = "Ошибка при сохранении", error = ex.Message });
        }
        finally
        {
            Console.WriteLine($"=== КОНЕЦ СОЗДАНИЯ ДВИЖЕНИЯ ===");
        }
    }
}