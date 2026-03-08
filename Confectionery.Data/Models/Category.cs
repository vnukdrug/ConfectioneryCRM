using System.ComponentModel.DataAnnotations;

namespace Confectionery.Data.Models;

public class Category
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Type { get; set; } = string.Empty; // product или ingredient

    public ICollection<Product> Products { get; set; } = new List<Product>();
}