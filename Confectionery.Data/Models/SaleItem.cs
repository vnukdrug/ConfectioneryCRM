using System.ComponentModel.DataAnnotations;

namespace Confectionery.Data.Models;

public class SaleItem
{
    [Key]
    public int Id { get; set; }

    public int SaleId { get; set; }
    public Sale Sale { get; set; } = null!;

    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public decimal Quantity { get; set; }
    public decimal Price { get; set; }
    public decimal TotalAmount { get; set; }
}