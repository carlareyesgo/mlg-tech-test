using System.Collections.Concurrent;
using MLG.Auth.Domain.Entities;
using MLG.Auth.Domain.Repositories;

namespace MLG.Auth.Infrastructure.Repositories;

public class InMemoryUserRepository : IUserRepository
{
    private readonly ConcurrentDictionary<string, User> _byEmail = new();

    public Task<User?> GetByEmailAsync(string email)
        => Task.FromResult(_byEmail.TryGetValue(email.ToLowerInvariant(), out var u) ? u : null);

    public Task AddAsync(User user)
    {
        _byEmail[user.Email.ToLowerInvariant()] = user;
        return Task.CompletedTask;
    }
}
