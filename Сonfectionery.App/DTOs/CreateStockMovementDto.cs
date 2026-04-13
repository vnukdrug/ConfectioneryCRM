namespace Confectionery.App.DTOs;

public class CreateStockMovementDto
{
    public int FilialId { get; set; }
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
    public string MovementType { get; set; } = "income"; 
}