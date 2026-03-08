namespace Confectionery.App.DTOs;

public class CreateEmployeeDto
{
    public string FullName { get; set; } = string.Empty;
    public string Login { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int? FilialId { get; set; }
}