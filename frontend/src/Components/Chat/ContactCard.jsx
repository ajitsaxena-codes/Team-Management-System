import { initials } from "../../Utils/helpers";

const ContactCard = ({ contact, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
        active ? "bg-slate-950 text-white" : "hover:bg-slate-50"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${
          active ? "bg-white text-slate-950" : "bg-slate-100 text-slate-700"
        }`}
      >
        {initials(contact.name)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={`truncate text-sm font-semibold ${active ? "text-white" : "text-slate-950"}`}>
            {contact.name}
          </p>

          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"
            }`}
          >
            {contact.role}
          </span>
        </div>

        <p className={`truncate text-xs ${active ? "text-slate-300" : "text-slate-500"}`}>
          {contact.email}
        </p>
      </div>
    </button>
  );
};

export default ContactCard;