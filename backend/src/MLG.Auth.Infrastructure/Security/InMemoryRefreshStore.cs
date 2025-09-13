namespace MLG.Auth.Infrastructure.Security;
public class InMemoryRefreshStore
{
    private readonly HashSet<string> _valid = new();
    private readonly object _lock = new();

    public void Add(string token)
    {
        lock (_lock) _valid.Add(token);
    }

    public bool Remove(string token)
    {
        lock (_lock) return _valid.Remove(token);
    }

    public bool Contains(string token)
    {
        lock (_lock) return _valid.Contains(token);
    }
}
