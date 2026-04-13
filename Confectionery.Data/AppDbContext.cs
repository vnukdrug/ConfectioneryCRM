using Microsoft.EntityFrameworkCore;
using Confectionery.Data.Models;

namespace Confectionery.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Filial> Filials { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<StockBalance> StockBalances { get; set; }
    public DbSet<StockMovement> StockMovements { get; set; }
    public DbSet<Sale> Sales { get; set; }
    public DbSet<SaleItem> SaleItems { get; set; }
    public DbSet<ProductionPlan> ProductionPlans { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);


        modelBuilder.Entity<User>()
            .HasIndex(u => u.Login)
            .IsUnique();

        modelBuilder.Entity<StockBalance>()
            .HasIndex(sb => new { sb.FilialId, sb.ProductId })
            .IsUnique();

        modelBuilder.Entity<StockMovement>()
            .HasOne(sm => sm.SourceFilial)
            .WithMany()
            .HasForeignKey(sm => sm.SourceFilialId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<StockMovement>()
            .HasOne(sm => sm.TargetFilial)
            .WithMany()
            .HasForeignKey(sm => sm.TargetFilialId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}