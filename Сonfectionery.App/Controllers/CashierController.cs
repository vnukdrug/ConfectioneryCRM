using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Confectionery.Data;
using Confectionery.Data.Models;
using Confectionery.App.DTOs;

namespace Confectionery.App.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin,Cashier")]
public class CashierController : ControllerBase
{
    private readonly AppDbContext _context;

    public CashierController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("products/{filialId}")]
    public async Task<ActionResult<IEnumerable<CashierProductDto>>> GetProducts(int filialId)
    {
        try
        {

            var products = await _context.StockBalances
                .Include(sb => sb.Product)
                .ThenInclude(p => p.Category)
                .Where(sb => sb.FilialId == filialId
                    && sb.Product.Category.Type == "product"  
                    && sb.Quantity > 0)                        
                .Select(sb => new CashierProductDto
                {
                    Id = sb.Product.Id,
                    Name = sb.Product.Name,
                    Price = sb.Product.Price,                  
                    Quantity = (int)sb.Quantity
                })
                .ToListAsync();

            return Ok(products);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ошибка при загрузке товаров: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при загрузке товаров" });
        }
    }

    [HttpPost("sale")]
    public async Task<ActionResult> CreateSale(SaleDto dto)
    {
        try
        {
            var filial = await _context.Filials.FindAsync(dto.FilialId);
            if (filial == null)
                return BadRequest(new { message = "Филиал не найден" });

            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                return Unauthorized(new { message = "Пользователь не авторизован" });

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var sale = new Sale
                {
                    FilialId = dto.FilialId,
                    TotalAmount = dto.Total,  
                    CreatedAt = DateTime.UtcNow,
                    CreatedByUserId = userId
                };
                _context.Sales.Add(sale);
                await _context.SaveChangesAsync();
                foreach (var item in dto.Items)
                {
                    var saleItem = new SaleItem
                    {
                        SaleId = sale.Id,
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        Price = item.Price,
                        TotalAmount = item.Total
                    };
                    _context.SaleItems.Add(saleItem);

                    var balance = await _context.StockBalances
                        .FirstOrDefaultAsync(sb => sb.FilialId == dto.FilialId && sb.ProductId == item.ProductId);

                    if (balance == null)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(new { message = $"Товар с ID {item.ProductId} не найден на складе" });
                    }

                    if (balance.Quantity < item.Quantity)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(new { message = $"Недостаточно товара {balance.Product?.Name}" });
                    }

                    balance.Quantity -= item.Quantity;

                    var movement = new StockMovement
                    {
                        FilialId = dto.FilialId,
                        ProductId = item.ProductId,
                        Quantity = -item.Quantity,
                        MovementType = "sale",
                        CreatedAt = DateTime.UtcNow,
                        CreatedByUserId = userId
                    };
                    _context.StockMovements.Add(movement);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message = "Продажа успешно оформлена",
                    saleId = sale.Id,
                    total = sale.TotalAmount
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Console.WriteLine($"Ошибка при создании продажи: {ex.Message}");
                if (ex.InnerException != null)
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                throw;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Глобальная ошибка: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при оформлении продажи" });
        }
    }

    [HttpGet("check/{id}")]
    public async Task<ActionResult<object>> GetCheck(int id)
    {
        try
        {
            var sale = await _context.Sales
                .Include(s => s.Filial)
                .Include(s => s.CreatedByUser)
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.Product)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (sale == null)
                return NotFound(new { message = "Продажа не найдена" });

            var check = new
            {
                sale.Id,
                sale.Filial.Name,
                sale.CreatedAt,
                Cashier = sale.CreatedByUser.FullName,
                Items = sale.SaleItems.Select(si => new
                {
                    si.Product.Name,
                    si.Quantity,
                    si.Price,
                    si.TotalAmount
                }),
                sale.TotalAmount
            };

            return Ok(check);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ошибка при получении чека: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при получении чека" });
        }
    }
}