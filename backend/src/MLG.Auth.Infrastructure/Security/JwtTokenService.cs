using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace MLG.Auth.Infrastructure.Security;

public record JwtPair(string AccessToken, string RefreshToken);

public class JwtTokenService
{
    private readonly byte[] _key;
    public JwtTokenService(string key) => _key = Encoding.UTF8.GetBytes(key);

    public JwtPair IssueTokens(string userId, string email)
    {
        var access  = IssueToken(userId, email, minutes: 15,           type: "access");
        var refresh = IssueToken(userId, email, minutes: 60*24*30,      type: "refresh");
        return new JwtPair(access, refresh);
    }

    private string IssueToken(string userId, string email, int minutes, string type)
    {
        var handler = new JwtSecurityTokenHandler();
        var desc = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim(JwtRegisteredClaimNames.Email, email),
                new Claim("typ", type)
            }),
            Expires = DateTime.UtcNow.AddMinutes(minutes),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(_key), SecurityAlgorithms.HmacSha256)
        };
        var token = handler.CreateToken(desc);
        return handler.WriteToken(token);
    }
}
