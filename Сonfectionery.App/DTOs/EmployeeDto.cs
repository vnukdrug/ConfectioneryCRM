namespace Confectionery.App.DTOs;

public class EmployeeDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Login { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Filial { get; set; } = string.Empty;
    public int? FilialId { get; set; }
}