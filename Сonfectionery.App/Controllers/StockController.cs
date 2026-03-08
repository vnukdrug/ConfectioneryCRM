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

    // GET: api/stock/balances
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

    // GET: api/stock/products
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

    // POST: api/stock/movement
    [HttpPost("movement")]
    public async Task<ActionResult> CreateMovement(CreateStockMovementDto dto)
    {
        Console.WriteLine($"=== Начало создания движения ===");
        Console.WriteLine($"FilialId: {dto.FilialId}, ProductId: {dto.ProductId}, Quantity: {dto.Quantity}");

        try
        {
            // Проверяем существование филиала
            var filial = await _context.Filials.FindAsync(dto.FilialId);
            if (filial == null)
            {
                Console.WriteLine($"Филиал с ID {dto.FilialId} не найден");
                return BadRequest(new { message = "Филиал не найден" });
            }

            // Проверяем существование товара
            var product = await _context.Products.FindAsync(dto.ProductId);
            if (product == null)
            {
                Console.WriteLine($"Товар с ID {dto.ProductId} не найден");
                return BadRequest(new { message = "Товар не найден" });
            }

            // Проверяем существование пользователя (ID=1)
            var user = await _context.Users.FindAsync(6);
            if (user == null)
            {
                Console.WriteLine("Пользователь с ID=1 не найден, создаем системного пользователя");

                user = new User
                {
                    FullName = "Система",
                    Login = "system",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("system"),
                    Role = "System",
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();
                Console.WriteLine($"Системный пользователь создан с ID: {user.Id}");
            }

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Находим или создаем остаток
                var balance = await _context.StockBalances
                    .FirstOrDefaultAsync(sb => sb.FilialId == dto.FilialId && sb.ProductId == dto.ProductId);

                if (balance == null)
                {
                    Console.WriteLine("Остаток не найден, создаем новый");
                    balance = new StockBalance
                    {
                        FilialId = dto.FilialId,
                        ProductId = dto.ProductId,
                        Quantity = 0
                    };
                    _context.StockBalances.Add(balance);
                }

                // Обновляем количество
                if (dto.MovementType == "income")
                {
                    balance.Quantity += dto.Quantity;
                    Console.WriteLine($"Приход: новый остаток = {balance.Quantity}");
                }
                else if (dto.MovementType == "outcome")
                {
                    if (balance.Quantity < dto.Quantity)
                    {
                        return BadRequest(new { message = "Недостаточно товара на складе" });
                    }
                    balance.Quantity -= dto.Quantity;
                }

                // Сохраняем движение
                var movement = new StockMovement
                {
                    FilialId = dto.FilialId,
                    ProductId = dto.ProductId,
                    Quantity = dto.Quantity,
                    MovementType = dto.MovementType,
                    CreatedAt = DateTime.UtcNow,
                    CreatedByUserId = user.Id
                };
                _context.StockMovements.Add(movement);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Движение товара успешно зарегистрировано" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ОШИБКА В ТРАНЗАКЦИИ: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                await transaction.RollbackAsync();
                throw;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ГЛОБАЛЬНАЯ ОШИБКА: {ex.Message}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
            return StatusCode(500, new { message = "Ошибка при сохранении", error = ex.Message });
        }
    }
}