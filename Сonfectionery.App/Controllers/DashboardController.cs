using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Confectionery.Data;
using Confectionery.App.DTOs;

namespace Confectionery.App.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats()
    {
        var today = DateTime.UtcNow.Date;
        var weekAgo = today.AddDays(-7);
        var monthAgo = today.AddMonths(-1);

        // Выручка за сегодня
        var todayRevenue = await _context.Sales
            .Where(s => s.CreatedAt.Date == today)
            .SumAsync(s => s.TotalAmount);

        // Выручка за неделю
        var weekRevenue = await _context.Sales
            .Where(s => s.CreatedAt >= weekAgo)
            .SumAsync(s => s.TotalAmount);

        // Выручка за месяц
        var monthRevenue = await _context.Sales
            .Where(s => s.CreatedAt >= monthAgo)
            .SumAsync(s => s.TotalAmount);

        // Количество филиалов
        var filialsCount = await _context.Filials.CountAsync();

        // Количество сотрудников
        var employeesCount = await _context.Users.CountAsync();

        // Общее количество товаров на складе
        var totalProducts = await _context.StockBalances
            .SumAsync(sb => sb.Quantity);

        // Количество позиций с низким остатком
        var lowStockCount = await _context.StockBalances
            .Include(sb => sb.Product)
            .Where(sb => sb.Quantity <= sb.Product.MinStock)
            .CountAsync();

        return Ok(new DashboardStatsDto
        {
            TodayRevenue = todayRevenue,
            WeekRevenue = weekRevenue,
            MonthRevenue = monthRevenue,
            FilialsCount = filialsCount,
            EmployeesCount = employeesCount,
            TotalProducts = (int)totalProducts,
            LowStockCount = lowStockCount
        });
    }

    [HttpGet("low-stock")]
    public async Task<ActionResult<IEnumerable<LowStockItemDto>>> GetLowStock()
    {
        var lowStock = await _context.StockBalances
            .Include(sb => sb.Filial)
            .Include(sb => sb.Product)
            .Where(sb => sb.Quantity <= sb.Product.MinStock)
            .OrderBy(sb => sb.Quantity) // сначала самые критичные
            .Take(10)
            .Select(sb => new LowStockItemDto
            {
                Id = sb.Id,
                Filial = sb.Filial.Name,
                Product = sb.Product.Name,
                Quantity = sb.Quantity,
                Unit = sb.Product.Unit,
                MinStock = sb.Product.MinStock
            })
            .ToListAsync();

        return Ok(lowStock);
    }

    [HttpGet("recent-sales")]
    public async Task<ActionResult<IEnumerable<RecentSaleDto>>> GetRecentSales()
    {
        var recentSales = await _context.Sales
            .Include(s => s.Filial)
            .Include(s => s.CreatedByUser)
            .OrderByDescending(s => s.CreatedAt)
            .Take(10)
            .Select(s => new RecentSaleDto
            {
                Id = s.Id,
                Filial = s.Filial.Name,
                Amount = s.TotalAmount,
                Date = s.CreatedAt,
                Cashier = s.CreatedByUser.FullName
            })
            .ToListAsync();

        return Ok(recentSales);
    }
}