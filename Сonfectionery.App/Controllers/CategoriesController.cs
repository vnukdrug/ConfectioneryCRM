using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Confectionery.Data;
using Confectionery.Data.Models;

namespace Confectionery.App.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _context;

    public CategoriesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
    {
        try
        {
            var categories = await _context.Categories.ToListAsync();
            return Ok(categories);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ошибка при загрузке категорий: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при загрузке категорий" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Category>> GetCategory(int id)
    {
        try
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
                return NotFound(new { message = "Категория не найдена" });

            return Ok(category);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ошибка при загрузке категории: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при загрузке категории" });
        }
    }

    [HttpPost]
    public async Task<ActionResult<Category>> CreateCategory(Category category)
    {
        try
        {
            var existing = await _context.Categories
                .FirstOrDefaultAsync(c => c.Name == category.Name && c.Type == category.Type);

            if (existing != null)
                return Conflict(new { message = "Категория с таким названием и типом уже существует" });

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ошибка при создании категории: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при создании категории" });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCategory(int id, Category category)
    {
        if (id != category.Id)
            return BadRequest(new { message = "ID не совпадают" });

        try
        {
            var existingCategory = await _context.Categories.FindAsync(id);
            if (existingCategory == null)
                return NotFound(new { message = "Категория не найдена" });

            // Проверяем уникальность
            var duplicate = await _context.Categories
                .FirstOrDefaultAsync(c => c.Name == category.Name && c.Type == category.Type && c.Id != id);

            if (duplicate != null)
                return Conflict(new { message = "Категория с таким названием и типом уже существует" });

            existingCategory.Name = category.Name;
            existingCategory.Type = category.Type;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ошибка при обновлении категории: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при обновлении категории" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        try
        {
            var category = await _context.Categories
                .Include(c => c.Products)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
                return NotFound(new { message = "Категория не найдена" });

            // Проверяем, есть ли товары в этой категории
            if (category.Products != null && category.Products.Any())
                return BadRequest(new { message = "Нельзя удалить категорию, в которой есть товары" });

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Категория успешно удалена" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ошибка при удалении категории: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при удалении категории" });
        }
    }
}