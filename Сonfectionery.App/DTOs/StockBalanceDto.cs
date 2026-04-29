public class StockBalanceDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }  
    public string Filial { get; set; } = string.Empty;
    public string Product { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string CategoryType { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal MinStock { get; set; }
}