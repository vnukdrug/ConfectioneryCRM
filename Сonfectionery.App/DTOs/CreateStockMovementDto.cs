namespace Confectionery.App.DTOs;

public class CreateStockMovementDto
{
    public int FilialId { get; set; }
    public int ProductId { get; set; }
    public decimal Quantity { get; set; } // положительное — приход, отрицательное — расход
    public string MovementType { get; set; } = "income"; // income, outcome
    public string? Reason { get; set; } // production, damage, inventory, expired, purchase
    public string? Description { get; set; } // примечание
}