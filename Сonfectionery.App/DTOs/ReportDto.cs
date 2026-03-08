namespace Confectionery.App.DTOs;

public class SalesByDayDto
{
    public string Date { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public int OrdersCount { get; set; }
}

public class SalesByFilialDto
{
    public string Filial { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public int OrdersCount { get; set; }
}

public class TopProductDto
{
    public string Product { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Total { get; set; }
}

public class ReportFilterDto
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? FilialId { get; set; }
}