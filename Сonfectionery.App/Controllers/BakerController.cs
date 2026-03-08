using Confectionery.App.DTOs;
using Confectionery.Data;
using Confectionery.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Confectionery.App.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin,Baker")]
public class BakerController : ControllerBase
{
    private readonly AppDbContext _context;

    public BakerController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/baker/available-products/5
    [HttpGet("available-products/{filialId}")]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetAvailableProducts(int filialId)
    {
        try
        {
            // Получаем все товары из категории "product", которые можно производить
            var products = await _context.Products
                .Include(p => p.Category)
                .Where(p => p.Category.Type == "product")
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

            return Ok(products);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ошибка при загрузке товаров: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при загрузке товаров" });
        }
    }

    // GET: api/baker/plan/5
    [HttpGet("plan/{filialId}")]
    public async Task<ActionResult<IEnumerable<PlanItemDto>>> GetPlan(int filialId)
    {
        try
        {
            var today = DateTime.UtcNow.Date;
            Console.WriteLine($"Поиск планов для филиала {filialId} на дату {today:yyyy-MM-dd}");

            // Сначала посмотрим все планы для этого филиала
            var allPlans = await _context.ProductionPlans
                .Include(p => p.Product)
                .Where(p => p.FilialId == filialId)
                .ToListAsync();

            Console.WriteLine($"Всего планов для филиала {filialId}: {allPlans.Count}");
            foreach (var p in allPlans)
            {
                Console.WriteLine($"  План ID={p.Id}, продукт={p.Product?.Name}, дата={p.PlanDate:yyyy-MM-dd HH:mm}, статус={p.Status}");
            }

            // Теперь фильтрованные
            var plans = await _context.ProductionPlans
                .Include(p => p.Product)
                .Where(p => p.FilialId == filialId && p.PlanDate.Date == today)
                .Select(p => new PlanItemDto
                {
                    Id = p.Id,
                    Product = p.Product.Name,
                    PlannedQuantity = p.PlannedQuantity,
                    ProducedQuantity = p.ProducedQuantity,
                    Status = p.Status,
                    Deadline = p.PlanDate.ToString("yyyy-MM-dd")
                })
                .ToListAsync();

            Console.WriteLine($"Найдено планов на сегодня: {plans.Count}");

            return Ok(plans);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ОШИБКА при загрузке плана: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при загрузке плана" });
        }
    }

    // POST: api/baker/create-plan
    [HttpPost("create-plan")]
    [Authorize(Roles = "Admin,Director")]
    public async Task<ActionResult> CreatePlan(CreatePlanDto dto)
    {
        try
        {
            Console.WriteLine($"Попытка создания плана:");
            Console.WriteLine($"- FilialId: {dto.FilialId}");
            Console.WriteLine($"- ProductId: {dto.ProductId}");
            Console.WriteLine($"- Quantity: {dto.Quantity}");
            Console.WriteLine($"- PlanDate: {dto.PlanDate}");

            var product = await _context.Products.FindAsync(dto.ProductId);
            if (product == null)
            {
                Console.WriteLine($"Товар с ID {dto.ProductId} не найден");
                return BadRequest(new { message = "Товар не найден" });
            }

            var filial = await _context.Filials.FindAsync(dto.FilialId);
            if (filial == null)
            {
                Console.WriteLine($"Филиал с ID {dto.FilialId} не найден");
                return BadRequest(new { message = "Филиал не найден" });
            }

            // Получаем ID текущего пользователя из токена
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                Console.WriteLine("Пользователь не авторизован");
                return Unauthorized(new { message = "Пользователь не авторизован" });
            }

            // 👇 ВАЖНО: Преобразуем дату в UTC
            var planDateUtc = DateTime.SpecifyKind(dto.PlanDate, DateTimeKind.Utc);

            var plan = new ProductionPlan
            {
                FilialId = dto.FilialId,
                ProductId = dto.ProductId,
                PlannedQuantity = dto.Quantity,
                ProducedQuantity = 0,
                PlanDate = planDateUtc,  // 👈 Используем UTC
                Status = "planned",
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = userId
            };

            _context.ProductionPlans.Add(plan);
            await _context.SaveChangesAsync();

            Console.WriteLine($"План создан с ID: {plan.Id}");
            return Ok(new { message = "План создан", planId = plan.Id });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ОШИБКА при создании плана: {ex.Message}");
            if (ex.InnerException != null)
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            return StatusCode(500, new { message = "Ошибка при создании плана" });
        }
    }

    // PUT: api/baker/done/5
    [HttpPut("done/{id}")]
    public async Task<ActionResult> MarkAsDone(int id)
    {
        try
        {
            Console.WriteLine($"✅ Отметка выполнения плана ID: {id}");

            var plan = await _context.ProductionPlans
                .Include(p => p.Product)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (plan == null)
            {
                Console.WriteLine($"❌ План с ID {id} не найден");
                return NotFound(new { message = "План не найден" });
            }

            Console.WriteLine($"📋 План найден: ProductId={plan.ProductId}, Quantity={plan.PlannedQuantity}, FilialId={plan.FilialId}");

            plan.ProducedQuantity = plan.PlannedQuantity;
            plan.Status = "completed";

            // 👇 ПОЛУЧАЕМ ID ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ ИЗ ТОКЕНА
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                Console.WriteLine("❌ Не удалось получить ID пользователя из токена");
                return Unauthorized(new { message = "Пользователь не авторизован" });
            }

            Console.WriteLine($"👤 Пользователь ID из токена: {userId}");

            // Добавляем готовую продукцию на склад
            Console.WriteLine($"📦 Поиск остатка для FilialId={plan.FilialId}, ProductId={plan.ProductId}");

            var balance = await _context.StockBalances
                .FirstOrDefaultAsync(sb => sb.FilialId == plan.FilialId
                                         && sb.ProductId == plan.ProductId);

            if (balance == null)
            {
                Console.WriteLine("➕ Остаток не найден, создаем новый");
                balance = new StockBalance
                {
                    FilialId = plan.FilialId,
                    ProductId = plan.ProductId,
                    Quantity = plan.PlannedQuantity
                };
                _context.StockBalances.Add(balance);
            }
            else
            {
                Console.WriteLine($"📊 Текущий остаток: {balance.Quantity}, добавляем {plan.PlannedQuantity}");
                balance.Quantity += plan.PlannedQuantity;
            }

            // Записываем движение товара
            Console.WriteLine("📝 Создание записи движения товара");
            var movement = new StockMovement
            {
                FilialId = plan.FilialId,
                ProductId = plan.ProductId,
                Quantity = plan.PlannedQuantity,
                MovementType = "production",
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = userId  // 👈 Используем реальный ID из токена
            };
            _context.StockMovements.Add(movement);

            await _context.SaveChangesAsync();
            Console.WriteLine("✅ Изменения сохранены в БД");

            return Ok(new { message = "Готово! Продукция добавлена на склад" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ ОШИБКА при отметке: {ex.Message}");
            if (ex.InnerException != null)
                Console.WriteLine($"📎 Inner exception: {ex.InnerException.Message}");
            return StatusCode(500, new { message = "Ошибка при отметке выполнения" });
        }
    }
}