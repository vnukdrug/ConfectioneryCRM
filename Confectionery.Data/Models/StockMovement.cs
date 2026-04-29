using System.ComponentModel.DataAnnotations;

namespace Confectionery.Data.Models;

public class StockMovement
{
    [Key]
    public int Id { get; set; }

    public int FilialId { get; set; }
    public Filial Filial { get; set; } = null!;

    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public decimal Quantity { get; set; }

    [Required, MaxLength(20)]
    public string MovementType { get; set; } = string.Empty;


    [MaxLength(50)]
    public string? Reason { get; set; } 

    [MaxLength(500)]
    public string? Description { get; set; } 

    public int? SourceFilialId { get; set; }
    public Filial? SourceFilial { get; set; }

    public int? TargetFilialId { get; set; }
    public Filial? TargetFilial { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;
}