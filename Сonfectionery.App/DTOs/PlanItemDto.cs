namespace Confectionery.App.DTOs;

public class PlanItemDto
{
    public int Id { get; set; }
    public string Product { get; set; } = string.Empty;
    public decimal PlannedQuantity { get; set; }
    public decimal ProducedQuantity { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Deadline { get; set; } = string.Empty;
}