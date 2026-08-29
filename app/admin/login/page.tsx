export default function Login() {
  return (
    <main className="login-page">
      <form className="login-card" action="/api/auth/login" method="post">
        <p>ADMIN ACCESS</p>
        <h1>Log in</h1>
        <label>
          Admin password
          <input type="password" name="password" required autoFocus />
        </label>
        <button className="primary-btn" type="submit">
          Log in
        </button>
      </form>
    </main>
  );
}
