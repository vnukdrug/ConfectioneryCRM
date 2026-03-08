namespace Confectionery.App.DTOs;

public class CreatePlanDto
{
    public int FilialId { get; set; }
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
    public DateTime PlanDate { get; set; }
}