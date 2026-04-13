using System.ComponentModel.DataAnnotations;

namespace Confectionery.Data.Models;

public class User
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Login { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string PasswordHash { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Role { get; set; } = string.Empty; 

    public int? FilialId { get; set; }
    public Filial? Filial { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();
    public ICollection<Sale> Sales { get; set; } = new List<Sale>();
    public ICollection<ProductionPlan> ProductionPlans { get; set; } = new List<ProductionPlan>();
}