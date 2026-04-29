using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Confectionery.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddReasonAndDescriptionToStockMovements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "StockMovements",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Reason",
                table: "StockMovements",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "StockMovements");

            migrationBuilder.DropColumn(
                name: "Reason",
                table: "StockMovements");
        }
    }
}
