using System.ComponentModel.DataAnnotations;

namespace Confectionery.Data.Models;

public class ProductionPlan
{
    [Key]
    public int Id { get; set; }

    public int FilialId { get; set; }
    public Filial Filial { get; set; } = null!;

    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public decimal PlannedQuantity { get; set; }
    public decimal ProducedQuantity { get; set; }

    public DateTime PlanDate { get; set; }

    [Required, MaxLength(20)]
    public string Status { get; set; } = "planned";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;
}