const UserList = ({ onlineUsers }) => (
  <aside className="sidebar" aria-label="Online users">
    <h2>Online</h2>
    <div className="online-list">
      {onlineUsers.length === 0 ? (
        <p className="muted">No users online yet.</p>
      ) : (
        onlineUsers.map((user) => (
          <div className="online-user" key={user}>
            <span aria-hidden="true" />
            {user}
          </div>
        ))
      )}
    </div>
  </aside>
);

export default UserList;
