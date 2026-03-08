namespace Confectionery.App.DTOs;

public class CashierProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
}

public class SaleDto
{
    public int FilialId { get; set; }
    public List<SaleItemDto> Items { get; set; } = new();
    public decimal Total { get; set; }
}

public class SaleItemDto
{
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
    public decimal Price { get; set; }
    public decimal Total { get; set; }
}