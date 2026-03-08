namespace Confectionery.App.DTOs;

public class DashboardStatsDto
{
    public decimal TodayRevenue { get; set; }
    public decimal WeekRevenue { get; set; }
    public decimal MonthRevenue { get; set; }
    public int FilialsCount { get; set; }
    public int EmployeesCount { get; set; }
    public int TotalProducts { get; set; }
    public int LowStockCount { get; set; }
}

public class RecentSaleDto
{
    public int Id { get; set; }
    public string Filial { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string Cashier { get; set; } = string.Empty;
}

public class LowStockItemDto
{
    public int Id { get; set; }
    public string Filial { get; set; } = string.Empty;
    public string Product { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal MinStock { get; set; }
}