using System.ComponentModel.DataAnnotations;

namespace Confectionery.Data.Models;

public class Product
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    [Required, MaxLength(10)]
    public string Unit { get; set; } = string.Empty; 

    public decimal MinStock { get; set; }

    public decimal Price { get; set; } = 0; 

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow; 
    public ICollection<StockBalance> StockBalances { get; set; } = new List<StockBalance>();
    public ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();
    public ICollection<SaleItem> SaleItems { get; set; } = new List<SaleItem>();
    public ICollection<ProductionPlan> ProductionPlans { get; set; } = new List<ProductionPlan>();
}