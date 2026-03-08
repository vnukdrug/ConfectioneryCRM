using Confectionery.App.DTOs;
using Confectionery.Data;
using Confectionery.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Confectionery.App.Controllers;

[Route("api/[controller]")]
[Authorize]
[ApiController]
public class FilialsController : ControllerBase
{
    private readonly AppDbContext _context;

    public FilialsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/filials
    [HttpGet]
    public async Task<ActionResult<IEnumerable<FilialDto>>> GetFilials()
    {
        var filials = await _context.Filials
            .Select(f => new FilialDto
            {
                Id = f.Id,
                Name = f.Name,
                Address = f.Address,
                Phone = f.Phone,
                EmployeesCount = f.Users.Count
            })
            .ToListAsync();

        return Ok(filials);
    }

    // GET: api/filials/5
    [HttpGet("{id}")]
    public async Task<ActionResult<FilialDto>> GetFilial(int id)
    {
        var filial = await _context.Filials
            .Where(f => f.Id == id)
            .Select(f => new FilialDto
            {
                Id = f.Id,
                Name = f.Name,
                Address = f.Address,
                Phone = f.Phone,
                EmployeesCount = f.Users.Count
            })
            .FirstOrDefaultAsync();

        if (filial == null)
            return NotFound();

        return Ok(filial);
    }

    // POST: api/filials
    [HttpPost]
    public async Task<ActionResult<Filial>> CreateFilial(Filial filial)
    {
        try
        {
            // Проверяем, нет ли филиала с таким же названием
            var existing = await _context.Filials
                .FirstOrDefaultAsync(f => f.Name == filial.Name);

            if (existing != null)
            {
                return Conflict(new { message = "Филиал с таким названием уже существует" });
            }

            _context.Filials.Add(filial);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetFilial), new { id = filial.Id }, filial);
        }
        catch (Exception ex)
        {
            // Логируем внутреннюю ошибку
            Console.WriteLine($"Ошибка при создании филиала: {ex.Message}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
            throw; // Пробрасываем дальше
        }
    }

    // PUT: api/filials/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateFilial(int id, Filial filial)
    {
        if (id != filial.Id)
            return BadRequest();

        // Проверяем, не занято ли название другим филиалом
        var existing = await _context.Filials
            .FirstOrDefaultAsync(f => f.Name == filial.Name && f.Id != id);

        if (existing != null)
        {
            return Conflict(new { message = "Филиал с таким названием уже существует" });
        }

        _context.Entry(filial).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await _context.Filials.AnyAsync(f => f.Id == id))
                return NotFound();
            else
                throw;
        }

        return NoContent();
    }

    // DELETE: api/filials/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFilial(int id)
    {
        var filial = await _context.Filials.FindAsync(id);
        if (filial == null)
            return NotFound();

        // Проверяем, есть ли у филиала сотрудники
        var hasEmployees = await _context.Users.AnyAsync(u => u.FilialId == id);
        if (hasEmployees)
        {
            return BadRequest(new { message = "Нельзя удалить филиал, в котором есть сотрудники" });
        }

        _context.Filials.Remove(filial);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}