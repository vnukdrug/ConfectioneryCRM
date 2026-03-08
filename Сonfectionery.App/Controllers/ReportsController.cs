using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Confectionery.Data;
using Confectionery.App.DTOs;

namespace Confectionery.App.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReportsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("sales-by-day")]
    public async Task<ActionResult<IEnumerable<SalesByDayDto>>> GetSalesByDay(ReportFilterDto filter)
    {
        try
        {
            Console.WriteLine($"📊 GetSalesByDay called with filter: Start={filter.StartDate}, End={filter.EndDate}, FilialId={filter.FilialId}");

            var query = _context.Sales.AsQueryable();

            if (filter.StartDate.HasValue)
            {
                var startDateUtc = DateTime.SpecifyKind(filter.StartDate.Value, DateTimeKind.Utc);
                query = query.Where(s => s.CreatedAt >= startDateUtc);
            }

            if (filter.EndDate.HasValue)
            {
                var endDateUtc = DateTime.SpecifyKind(filter.EndDate.Value, DateTimeKind.Utc);
                query = query.Where(s => s.CreatedAt <= endDateUtc);
            }

            if (filter.FilialId.HasValue)
                query = query.Where(s => s.FilialId == filter.FilialId);

            var sales = await query.ToListAsync();
            Console.WriteLine($"Найдено продаж: {sales.Count}");

            var result = sales
                .GroupBy(s => s.CreatedAt.Date)
                .Select(g => new SalesByDayDto
                {
                    Date = g.Key.ToString("yyyy-MM-dd"),
                    Total = g.Sum(s => s.TotalAmount),
                    OrdersCount = g.Count()
                })
                .OrderBy(g => g.Date)
                .ToList();

            Console.WriteLine($"Сгруппировано по дням: {result.Count} записей");
            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Ошибка в GetSalesByDay: {ex.Message}");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("sales-by-filial")]
    public async Task<ActionResult<IEnumerable<SalesByFilialDto>>> GetSalesByFilial(ReportFilterDto filter)
    {
        try
        {
            Console.WriteLine($"📊 GetSalesByFilial called");

            var query = _context.Sales
                .Include(s => s.Filial)
                .AsQueryable();

            if (filter.StartDate.HasValue)
            {
                var startDateUtc = DateTime.SpecifyKind(filter.StartDate.Value, DateTimeKind.Utc);
                query = query.Where(s => s.CreatedAt >= startDateUtc);
            }

            if (filter.EndDate.HasValue)
            {
                var endDateUtc = DateTime.SpecifyKind(filter.EndDate.Value, DateTimeKind.Utc);
                query = query.Where(s => s.CreatedAt <= endDateUtc);
            }

            var sales = await query.ToListAsync();
            Console.WriteLine($"Найдено продаж: {sales.Count}");

            var result = sales
                .GroupBy(s => s.Filial?.Name ?? "Без филиала")
                .Select(g => new SalesByFilialDto
                {
                    Filial = g.Key,
                    Total = g.Sum(s => s.TotalAmount),
                    OrdersCount = g.Count()
                })
                .OrderByDescending(f => f.Total)
                .ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Ошибка в GetSalesByFilial: {ex.Message}");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("top-products")]
    public async Task<ActionResult<IEnumerable<TopProductDto>>> GetTopProducts(ReportFilterDto filter)
    {
        try
        {
            Console.WriteLine($"📊 GetTopProducts called");

            var query = _context.SaleItems
                .Include(si => si.Product)
                .Include(si => si.Sale)
                .AsQueryable();

            if (filter.StartDate.HasValue)
            {
                var startDateUtc = DateTime.SpecifyKind(filter.StartDate.Value, DateTimeKind.Utc);
                query = query.Where(si => si.Sale.CreatedAt >= startDateUtc);
            }

            if (filter.EndDate.HasValue)
            {
                var endDateUtc = DateTime.SpecifyKind(filter.EndDate.Value, DateTimeKind.Utc);
                query = query.Where(si => si.Sale.CreatedAt <= endDateUtc);
            }

            if (filter.FilialId.HasValue)
                query = query.Where(si => si.Sale.FilialId == filter.FilialId);

            var items = await query.ToListAsync();
            Console.WriteLine($"Найдено позиций: {items.Count}");

            var result = items
                .GroupBy(si => si.Product?.Name ?? "Неизвестно")
                .Select(g => new TopProductDto
                {
                    Product = g.Key,
                    Quantity = g.Sum(si => (int)si.Quantity),
                    Total = g.Sum(si => si.TotalAmount)
                })
                .OrderByDescending(p => p.Total)
                .Take(10)
                .ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Ошибка в GetTopProducts: {ex.Message}");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("summary")]
    public async Task<ActionResult<object>> GetSummary(ReportFilterDto filter)
    {
        try
        {
            Console.WriteLine($"📊 GetSummary called");

            var query = _context.Sales.AsQueryable();

            if (filter.StartDate.HasValue)
            {
                var startDateUtc = DateTime.SpecifyKind(filter.StartDate.Value, DateTimeKind.Utc);
                query = query.Where(s => s.CreatedAt >= startDateUtc);
            }

            if (filter.EndDate.HasValue)
            {
                var endDateUtc = DateTime.SpecifyKind(filter.EndDate.Value, DateTimeKind.Utc);
                query = query.Where(s => s.CreatedAt <= endDateUtc);
            }

            if (filter.FilialId.HasValue)
                query = query.Where(s => s.FilialId == filter.FilialId);

            var sales = await query.ToListAsync();

            var totalRevenue = sales.Sum(s => s.TotalAmount);
            var ordersCount = sales.Count;
            var averageCheck = ordersCount > 0 ? totalRevenue / ordersCount : 0;

            return Ok(new
            {
                totalRevenue,
                ordersCount,
                averageCheck
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Ошибка в GetSummary: {ex.Message}");
            return StatusCode(500, new { message = ex.Message });
        }
    }
}