using System.Text;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MLG.Auth.Domain.Entities;
using MLG.Auth.Domain.Repositories;
using MLG.Auth.Infrastructure.Repositories;
using MLG.Auth.Infrastructure.Security;
using MLG.Auth.Api;

var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration;

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Autenticación JWT",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference
        {
            Type = ReferenceType.SecurityScheme,
            Id = "Bearer"
        }
    };

    c.AddSecurityDefinition("Bearer", securityScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { securityScheme, Array.Empty<string>() }
    });
});


// CORS (abierto para dev)
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

// DI
builder.Services.AddSingleton<IUserRepository, InMemoryUserRepository>();

var secret = config["Jwt:Key"] ?? "dev_secret_change_me";
builder.Services.AddSingleton(new JwtTokenService(secret));

// store in-memory de refresh tokens
builder.Services.AddSingleton<InMemoryRefreshStore>();

// JWT Auth
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.MapInboundClaims = false;

        o.TokenValidationParameters = new()
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        // (opcional) logs de diagnóstico
        o.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = ctx =>
            {
                Console.WriteLine($"[JWT FAILED] {ctx.Exception.Message}");
                return Task.CompletedTask;
            },
            OnTokenValidated = ctx =>
            {
                Console.WriteLine("[JWT OK] token válido");
                return Task.CompletedTask;
            }
        };
    });


builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// ====== Endpoints ======

app.MapPost("/api/auth/register", async (
    IUserRepository repo,
    JwtTokenService jwt,
    InMemoryRefreshStore store,
    RegisterDto dto) =>
{
    var existing = await repo.GetByEmailAsync(dto.Email);
    if (existing != null)
        return Results.BadRequest(new { message = "Email already registered" });

    var user = new User
    {
        Email = dto.Email,
        Name = dto.Name,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
    };
    await repo.AddAsync(user);

    var tokens = jwt.IssueTokens(user.Id.ToString(), user.Email);
    store.Add(tokens.RefreshToken);
    return Results.Ok(new { user = new { user.Id, user.Email, user.Name }, tokens });
})
.WithName("Register")
.WithOpenApi();

app.MapPost("/api/auth/login", async (
    IUserRepository repo,
    JwtTokenService jwt,
    InMemoryRefreshStore store,
    LoginDto dto) =>
{
    var user = await repo.GetByEmailAsync(dto.Email);
    if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        return Results.Unauthorized();

    var tokens = jwt.IssueTokens(user.Id.ToString(), user.Email);
    store.Add(tokens.RefreshToken);
    return Results.Ok(new { user = new { user.Id, user.Email, user.Name }, tokens });
})
.WithName("Login")
.WithOpenApi();

app.MapGet("/api/auth/me", (ClaimsPrincipal user) =>
{
    var sub = user.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? user.FindFirstValue(ClaimTypes.NameIdentifier);
    var email = user.FindFirstValue(JwtRegisteredClaimNames.Email) ?? user.FindFirstValue(ClaimTypes.Email);

    return sub is null ? Results.Unauthorized() : Results.Ok(new { id = sub, email });
})
.RequireAuthorization()
.WithName("Me")
.WithOpenApi();


app.MapPost("/api/auth/refresh", (
    InMemoryRefreshStore store,
    JwtTokenService jwt,
    RefreshDto body) =>
{
    if (string.IsNullOrWhiteSpace(body.RefreshToken))
        return Results.BadRequest();

    if (!store.Contains(body.RefreshToken))
        return Results.Unauthorized();

    var handler = new JwtSecurityTokenHandler();

    try
    {
        // Validar firma y expiración del refresh
        var parameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            ValidateLifetime = true
        };

        var principal = handler.ValidateToken(body.RefreshToken, parameters, out _);
        var typ = principal.Claims.FirstOrDefault(c => c.Type == "typ")?.Value;
        if (typ != "refresh") return Results.Unauthorized();

        var sub = principal.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub)?.Value ?? "";
        var email = principal.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Email)?.Value ?? "";

        // Rotar: quitar viejo, emitir nuevos, guardar nuevo
        store.Remove(body.RefreshToken);
        var tokens = jwt.IssueTokens(sub, email);
        store.Add(tokens.RefreshToken);

        return Results.Ok(tokens);
    }
    catch
    {
        return Results.Unauthorized();
    }
})
.WithName("Refresh")
.WithOpenApi();

app.Run();
