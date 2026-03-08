using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Confectionery.Data;
using Confectionery.Data.Models;
using Confectionery.App.DTOs;

namespace Confectionery.App.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProductsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/products
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts()
    {
        try
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .Select(p => new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    CategoryId = p.CategoryId,
                    Category = p.Category.Name,
                    CategoryType = p.Category.Type,
                    Unit = p.Unit,
                    Price = p.Price,
                    MinStock = p.MinStock
                })
                .ToListAsync();

            Console.WriteLine($"Найдено товаров: {products.Count}"); // для отладки
            return Ok(products);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ошибка: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при загрузке товаров" });
        }
    }
    // GET: api/products/5
    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetProduct(int id)
    {
        try
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Where(p => p.Id == id)
                .Select(p => new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    CategoryId = p.CategoryId,
                    Category = p.Category.Name,
                    CategoryType = p.Category.Type,
                    Unit = p.Unit,
                    Price = p.Price,
                    MinStock = p.MinStock
                })
                .FirstOrDefaultAsync();

            if (product == null)
                return NotFound(new { message = "Товар не найден" });

            return Ok(product);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ошибка при загрузке товара: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при загрузке товара" });
        }
    }

    // POST: api/products
    [HttpPost]
    public async Task<ActionResult<Product>> CreateProduct(CreateProductDto dto)
    {
        try
        {
            var category = await _context.Categories.FindAsync(dto.CategoryId);
            if (category == null)
                return BadRequest(new { message = "Категория не найдена" });

            var existing = await _context.Products
                .FirstOrDefaultAsync(p => p.Name == dto.Name);

            if (existing != null)
                return Conflict(new { message = "Товар с таким названием уже существует" });

            var product = new Product
            {
                Name = dto.Name,
                CategoryId = dto.CategoryId,
                Unit = dto.Unit,
                Price = dto.Price,
                MinStock = dto.MinStock,
                CreatedAt = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            // 👇 ВАЖНО: Не возвращаем product напрямую, а создаем DTO
            var productDto = new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                CategoryId = product.CategoryId,
                Category = category.Name,
                CategoryType = category.Type,
                Unit = product.Unit,
                Price = product.Price,
                MinStock = product.MinStock
            };

            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, productDto);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ошибка при создании товара: {ex.Message}");
            if (ex.InnerException != null)
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            return StatusCode(500, new { message = "Ошибка при создании товара" });
        }
    }
    // PUT: api/products/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProduct(int id, Product product)
    {
        if (id != product.Id)
            return BadRequest(new { message = "ID не совпадают" });

        try
        {
            var existingProduct = await _context.Products.FindAsync(id);
            if (existingProduct == null)
                return NotFound(new { message = "Товар не найден" });

            var category = await _context.Categories.FindAsync(product.CategoryId);
            if (category == null)
                return BadRequest(new { message = "Категория не найдена" });

            var duplicate = await _context.Products
                .FirstOrDefaultAsync(p => p.Name == product.Name && p.Id != id);

            if (duplicate != null)
                return Conflict(new { message = "Товар с таким названием уже существует" });

            existingProduct.Name = product.Name;
            existingProduct.CategoryId = product.CategoryId;
            existingProduct.Unit = product.Unit;
            existingProduct.Price = product.Price;
            existingProduct.MinStock = product.MinStock;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ошибка при обновлении товара: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при обновлении товара" });
        }
    }

    // DELETE: api/products/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        try
        {
            var product = await _context.Products
                .Include(p => p.StockBalances)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
                return NotFound(new { message = "Товар не найден" });

            if (product.StockBalances != null && product.StockBalances.Any(sb => sb.Quantity > 0))
                return BadRequest(new { message = "Нельзя удалить товар, который есть на складе" });

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Товар успешно удален" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ошибка при удалении товара: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при удалении товара" });
        }
    }
}