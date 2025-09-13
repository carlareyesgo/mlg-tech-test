using MLG.Auth.Domain.Entities;

namespace MLG.Auth.Domain.Repositories;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task AddAsync(User user);
}
