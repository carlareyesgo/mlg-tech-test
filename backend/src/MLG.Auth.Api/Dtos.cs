namespace MLG.Auth.Api;

public record RegisterDto(string Email, string Password, string? Name);
public record LoginDto(string Email, string Password);
public record RefreshDto(string RefreshToken);
