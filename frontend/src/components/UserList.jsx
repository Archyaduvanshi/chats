const UserList = ({ onlineUsers }) => (
  <aside
    className="min-h-0 rounded-lg border border-[#dce4ef] bg-white p-3.5 lg:p-[18px]"
    aria-label="Online users"
  >
    <h2 className="m-0 mb-3.5 text-base font-bold">Online</h2>
    <div className="flex gap-2.5 overflow-x-auto pb-0.5 lg:grid lg:overflow-visible lg:pb-0">
      {onlineUsers.length === 0 ? (
        <p className="text-[#687384]">No users online yet.</p>
      ) : (
        onlineUsers.map((user) => (
          <div
            className="flex min-w-0 flex-none items-center gap-2.5 font-bold lg:flex-auto"
            key={user}
          >
            <span className="h-[9px] w-[9px] flex-none rounded-full bg-[#22a66c]" aria-hidden="true" />
            {user}
          </div>
        ))
      )}
    </div>
  </aside>
);

export default UserList;
