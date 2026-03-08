using System.ComponentModel.DataAnnotations;

namespace Confectionery.Data.Models;

public class StockBalance
{
    [Key]
    public int Id { get; set; }

    public int FilialId { get; set; }
    public Filial Filial { get; set; } = null!;

    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public decimal Quantity { get; set; }
}