using System.ComponentModel.DataAnnotations;

namespace Confectionery.Data.Models;

public class Sale
{
    [Key]
    public int Id { get; set; }

    public int FilialId { get; set; }
    public Filial Filial { get; set; } = null!;

    public decimal TotalAmount { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;

    public ICollection<SaleItem> SaleItems { get; set; } = new List<SaleItem>();
}