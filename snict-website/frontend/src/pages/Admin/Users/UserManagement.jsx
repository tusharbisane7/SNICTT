import { useEffect, useMemo, useState } from "react";

import {
  Users,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  X,
  User,
  Mail,
  Phone,
  CalendarDays,
  MapPin,
  Droplets,
  VenusAndMars,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import api from "../../../services/api";

import "./UserManagement.css";

function UserManagement() {
  // =========================================================
  // STATE
  // =========================================================

  const [members, setMembers] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [selectedMember, setSelectedMember] =
    useState(null);

  const [editingMember, setEditingMember] =
    useState(null);

  const [actionLoading, setActionLoading] =
    useState(false);

  // =========================================================
  // LOAD MEMBERS
  // =========================================================

  const loadMembers = async (
    showRefresh = false
  ) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response =
        await api.get("/admin/members");

      if (response.data?.success) {
        setMembers(
          response.data.members || []
        );
      } else {
        setMembers([]);

        setError(
          response.data?.message ||
            "Unable to load members."
        );
      }
    } catch (error) {
      console.error(
        "Load members error:",
        error
      );

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        setError(
          "Admin authentication expired. Please login again."
        );
      } else {
        setError(
          error.response?.data?.message ||
            "Unable to load members."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadMembers();
  }, []);

  // =========================================================
  // SUCCESS MESSAGE
  // =========================================================

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [success]);

  // =========================================================
  // HELPERS
  // =========================================================

  const getMemberId = (member) => {
    return (
      member.id ||
      member.user_id ||
      null
    );
  };

  const getName = (member) => {
    return (
      member.full_name ||
      member.fullName ||
      member.username ||
      "Unknown Member"
    );
  };

  const getUsername = (member) => {
    return (
      member.username ||
      "—"
    );
  };

  const getEmail = (member) => {
    return (
      member.email ||
      "—"
    );
  };

  const getMobile = (member) => {
    return (
      member.mobile ||
      member.phone ||
      "—"
    );
  };

  const getAge = (member) => {
    return (
      member.age ??
      "—"
    );
  };

  const getSex = (member) => {
    return (
      member.sex ||
      "—"
    );
  };

  const getAddress = (member) => {
    return (
      member.address ||
      "—"
    );
  };

  const getBloodGroup = (member) => {
    return (
      member.blood_group ||
      member.bloodGroup ||
      "—"
    );
  };

  // =========================================================
  // PROFILE IMAGE
  // =========================================================
  // Images are uploaded from the user's desktop and served
  // by the backend from /uploads/profile/...
  // =========================================================

  const getProfileImage = (member) => {
    const rawImage =
      member?.profileImage ||
      member?.profile_image ||
      member?.profileImageUrl ||
      member?.profile_image_url ||
      member?.photoUrl ||
      member?.photo_url ||
      member?.image ||
      member?.image_url ||
      "";

    if (!rawImage) {
      return "";
    }

    const image = String(rawImage).trim();

    if (!image) {
      return "";
    }

    // Already a complete URL or data URL.
    if (
      image.startsWith("http://") ||
      image.startsWith("https://") ||
      image.startsWith("data:")
    ) {
      return image;
    }

    const apiUrl =
      import.meta.env.VITE_API_URL ||
      "https://snict-backend.onrender.com/api";

    let backendOrigin = apiUrl.trim();

    // API URL is normally .../api, while uploaded files
    // are served from .../uploads/...
    if (backendOrigin.endsWith("/api")) {
      backendOrigin = backendOrigin.slice(
        0,
        backendOrigin.length - 4
      );
    }

    backendOrigin =
      backendOrigin.replace(/\/$/, "");

    const cleanPath = image.startsWith("/")
      ? image
      : `/${image}`;

    return `${backendOrigin}${cleanPath}`;
  };

  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value);
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatDateTime = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value);
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =========================================================
  // FILTER MEMBERS
  // =========================================================

  const filteredMembers = useMemo(() => {
    const query =
      search
        .trim()
        .toLowerCase();

    if (!query) {
      return members;
    }

    return members.filter(
      (member) => {
        const name =
          String(
            getName(member)
          ).toLowerCase();

        const username =
          String(
            getUsername(member)
          ).toLowerCase();

        const email =
          String(
            getEmail(member)
          ).toLowerCase();

        const mobile =
          String(
            getMobile(member)
          ).toLowerCase();

        const bloodGroup =
          String(
            getBloodGroup(member)
          ).toLowerCase();

        return (
          name.includes(query) ||
          username.includes(query) ||
          email.includes(query) ||
          mobile.includes(query) ||
          bloodGroup.includes(query)
        );
      }
    );
  }, [
    members,
    search,
  ]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const stats = useMemo(() => {
    const total =
      members.length;

    const male =
      members.filter(
        (member) =>
          String(
            member.sex || ""
          ).toLowerCase() ===
          "male"
      ).length;

    const female =
      members.filter(
        (member) =>
          String(
            member.sex || ""
          ).toLowerCase() ===
          "female"
      ).length;

    return {
      total,
      male,
      female,
    };
  }, [members]);

  // =========================================================
  // VIEW MEMBER
  // =========================================================

  const viewMember = async (
    member
  ) => {
    const id =
      getMemberId(member);

    if (!id) {
      setError(
        "Invalid member ID."
      );

      return;
    }

    try {
      setError("");

      const response =
        await api.get(
          `/admin/members/${id}`
        );

      if (
        response.data?.success
      ) {
        setSelectedMember(
          response.data.member
        );
      } else {
        setError(
          response.data?.message ||
            "Unable to load member."
        );
      }
    } catch (error) {
      console.error(
        "View member error:",
        error
      );

      setError(
        error.response?.data
          ?.message ||
          "Unable to load member details."
      );
    }
  };

  // =========================================================
  // EDIT MEMBER
  // =========================================================

  const startEdit = (
    member
  ) => {
    setEditingMember({
      id: getMemberId(member),

      fullName:
        member.full_name ||
        "",

      username:
        member.username ||
        "",

      email:
        member.email ||
        "",

      mobile:
        member.mobile ||
        "",

      age:
        member.age ??
        "",

      sex:
        member.sex ||
        "",

      address:
        member.address ||
        "",

      bloodGroup:
        member.blood_group ||
        "",
    });

    setSelectedMember(null);

    setError("");
  };

  // =========================================================
  // HANDLE EDIT CHANGE
  // =========================================================

  const handleEditChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setEditingMember(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  // =========================================================
  // UPDATE MEMBER
  // =========================================================

  const updateMember =
    async (event) => {
      event.preventDefault();

      if (
        actionLoading ||
        !editingMember?.id
      ) {
        return;
      }

      try {
        setActionLoading(true);

        setError("");

        const response =
          await api.put(
            `/admin/members/${editingMember.id}`,
            {
              fullName:
                editingMember.fullName,

              username:
                editingMember.username,

              email:
                editingMember.email,

              mobile:
                editingMember.mobile,

              age:
                editingMember.age,

              sex:
                editingMember.sex,

              address:
                editingMember.address,

              bloodGroup:
                editingMember.bloodGroup,
            }
          );

        if (
          !response.data?.success
        ) {
          throw new Error(
            response.data
              ?.message ||
              "Unable to update member."
          );
        }

        setMembers(
          (previous) =>
            previous.map(
              (member) =>
                String(
                  getMemberId(
                    member
                  )
                ) ===
                String(
                  editingMember.id
                )
                  ? response.data
                      .member
                  : member
            )
        );

        setEditingMember(null);

        setSuccess(
          "Member updated successfully."
        );
      } catch (error) {
        console.error(
          "Update member error:",
          error
        );

        setError(
          error.response?.data
            ?.message ||
            error.message ||
            "Unable to update member."
        );
      } finally {
        setActionLoading(false);
      }
    };

  // =========================================================
  // DELETE MEMBER
  // =========================================================

  const deleteMember =
    async (member) => {
      if (actionLoading) {
        return;
      }

      const id =
        getMemberId(member);

      if (!id) {
        setError(
          "Invalid member ID."
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Are you sure you want to permanently delete ${getName(
            member
          )}'s account?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);

        setError("");

        const response =
          await api.delete(
            `/admin/members/${id}`
          );

        if (
          !response.data?.success
        ) {
          throw new Error(
            response.data
              ?.message ||
              "Unable to delete member."
          );
        }

        setMembers(
          (previous) =>
            previous.filter(
              (item) =>
                String(
                  getMemberId(item)
                ) !==
                String(id)
            )
        );

        setSelectedMember(null);

        setSuccess(
          "Member account deleted successfully."
        );
      } catch (error) {
        console.error(
          "Delete member error:",
          error
        );

        setError(
          error.response?.data
            ?.message ||
            error.message ||
            "Unable to delete member."
        );
      } finally {
        setActionLoading(false);
      }
    };

  // =========================================================
  // CLOSE MODALS
  // =========================================================

  const closeViewModal = () => {
    setSelectedMember(null);
  };

  const closeEditModal = () => {
    if (!actionLoading) {
      setEditingMember(null);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="user-management-page">

        <div className="user-management-loading">

          <div className="user-loading-spinner" />

          <p>
            Loading member accounts...
          </p>

        </div>

      </main>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="user-management-page">

      <div className="user-management-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="user-management-header">

          <div>

            <span className="user-management-label">
              SNICT ADMINISTRATION
            </span>

            <h1>
              Member Accounts
            </h1>

            <p>
              Manage registered members,
              account information and
              membership records.
            </p>

          </div>

          <button
            type="button"
            className="user-refresh-btn"
            onClick={() =>
              loadMembers(true)
            }
            disabled={
              refreshing
            }
          >

            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "user-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}

          </button>

        </header>


        {/* =================================================
            ALERT
        ================================================= */}

        {error && (
          <div className="user-management-alert error">

            <AlertCircle
              size={17}
            />

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              <X size={15} />
            </button>

          </div>
        )}


        {/* =================================================
            SUCCESS
        ================================================= */}

        {success && (
          <div className="user-management-alert success">

            <CheckCircle2
              size={17}
            />

            <span>
              {success}
            </span>

          </div>
        )}


        {/* =================================================
            STATS
        ================================================= */}

        <section className="user-management-stats">

          <div className="user-stat-card">

            <div className="user-stat-icon">
              <Users size={20} />
            </div>

            <div>

              <span>
                Total Members
              </span>

              <strong>
                {stats.total}
              </strong>

            </div>

          </div>


          <div className="user-stat-card">

            <div className="user-stat-icon">
              <User size={20} />
            </div>

            <div>

              <span>
                Male Members
              </span>

              <strong>
                {stats.male}
              </strong>

            </div>

          </div>


          <div className="user-stat-card">

            <div className="user-stat-icon">
              <VenusAndMars
                size={20}
              />
            </div>

            <div>

              <span>
                Female Members
              </span>

              <strong>
                {stats.female}
              </strong>

            </div>

          </div>


          <div className="user-stat-card">

            <div className="user-stat-icon">
              <ShieldCheck
                size={20}
              />
            </div>

            <div>

              <span>
                Registered Accounts
              </span>

              <strong>
                {stats.total}
              </strong>

            </div>

          </div>

        </section>


        {/* =================================================
            TOOLBAR
        ================================================= */}

        <section className="user-management-toolbar">

          <div className="user-search">

            <Search size={17} />

            <input
              type="text"
              placeholder="Search name, username, email, mobile..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>

          {search && (
            <div className="user-search-result">

              Showing{" "}
              <strong>
                {
                  filteredMembers.length
                }
              </strong>{" "}
              of{" "}
              <strong>
                {members.length}
              </strong>

            </div>
          )}

        </section>


        {/* =================================================
            EMPTY
        ================================================= */}

        {filteredMembers.length ===
        0 ? (

          <div className="user-management-empty">

            <Users
              size={44}
            />

            <h2>
              No members found
            </h2>

            <p>
              {search
                ? "No member matches your search."
                : "There are no registered members yet."}
            </p>

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
              >
                Clear Search
              </button>
            )}

          </div>

        ) : (

          /* =================================================
             TABLE
          ================================================= */

          <section className="user-table-wrapper">

            <div className="user-table-scroll">

              <table className="user-table">

                <thead>

                  <tr>

                    <th>
                      Member
                    </th>

                    <th>
                      Username
                    </th>

                    <th>
                      Contact
                    </th>

                    <th>
                      Age / Gender
                    </th>

                    <th>
                      Blood Group
                    </th>

                    <th>
                      Joined
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredMembers.map(
                    (member) => {

                      const id =
                        getMemberId(
                          member
                        );

                      return (
                        <tr
                          key={id}
                        >

                          {/* MEMBER */}

                          <td>

                            <div className="user-member-cell">

                              <div className="user-member-avatar">
                                {getProfileImage(member) ? (
                                  <img
                                    src={getProfileImage(member)}
                                    alt={getName(member)}
                                    loading="lazy"
                                    onError={(event) => {
                                      event.currentTarget.style.display =
                                        "none";

                                      const parent =
                                        event.currentTarget.parentElement;

                                      if (parent) {
                                        parent.classList.add(
                                          "user-avatar-image-error"
                                        );
                                      }
                                    }}
                                  />
                                ) : (
                                  <User size={16} />
                                )}
                              </div>

                              <div>

                                <strong>
                                  {
                                    getName(
                                      member
                                    )
                                  }
                                </strong>

                                <span>
                                  ID:{" "}
                                  {id}
                                </span>

                              </div>

                            </div>

                          </td>


                          {/* USERNAME */}

                          <td>

                            <span className="user-username">
                              @
                              {
                                getUsername(
                                  member
                                )
                              }
                            </span>

                          </td>


                          {/* CONTACT */}

                          <td>

                            <div className="user-contact-cell">

                              <span>
                                <Mail
                                  size={13}
                                />

                                {
                                  getEmail(
                                    member
                                  )
                                }

                              </span>

                              <span>
                                <Phone
                                  size={13}
                                />

                                {
                                  getMobile(
                                    member
                                  )
                                }

                              </span>

                            </div>

                          </td>


                          {/* AGE / GENDER */}

                          <td>

                            <div className="user-basic-cell">

                              <strong>
                                {
                                  getAge(
                                    member
                                  )
                                }{" "}
                                yrs
                              </strong>

                              <span>
                                {
                                  getSex(
                                    member
                                  )
                                }
                              </span>

                            </div>

                          </td>


                          {/* BLOOD GROUP */}

                          <td>

                            <span className="user-blood-group">

                              <Droplets
                                size={14}
                              />

                              {
                                getBloodGroup(
                                  member
                                )
                              }

                            </span>

                          </td>


                          {/* JOINED */}

                          <td>

                            <span className="user-date">

                              <CalendarDays
                                size={14}
                              />

                              {formatDate(
                                member.created_at
                              )}

                            </span>

                          </td>


                          {/* ACTIONS */}

                          <td>

                            <div className="user-row-actions">

                              {/* VIEW */}

                              <button
                                type="button"
                                className="user-view-btn"
                                onClick={() =>
                                  viewMember(
                                    member
                                  )
                                }
                                title="View member"
                              >

                                <Eye
                                  size={15}
                                />

                              </button>


                              {/* EDIT */}

                              <button
                                type="button"
                                className="user-edit-btn"
                                onClick={() =>
                                  startEdit(
                                    member
                                  )
                                }
                                title="Edit member"
                              >

                                <Pencil
                                  size={15}
                                />

                              </button>


                              {/* DELETE */}

                              <button
                                type="button"
                                className="user-delete-btn"
                                onClick={() =>
                                  deleteMember(
                                    member
                                  )
                                }
                                disabled={
                                  actionLoading
                                }
                                title="Delete member"
                              >

                                <Trash2
                                  size={15}
                                />

                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          </section>

        )}

      </div>


      {/* =====================================================
          MEMBER DETAILS MODAL
      ===================================================== */}

      {selectedMember && (

        <div
          className="user-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeViewModal();
            }

          }}
        >

          <section
            className="user-details-modal"
            role="dialog"
            aria-modal="true"
          >

            {/* HEADER */}

            <header className="user-modal-header">

              <div>

                <span>
                  MEMBER ACCOUNT
                </span>

                <h2>
                  {
                    getName(
                      selectedMember
                    )
                  }
                </h2>

              </div>

              <button
                type="button"
                onClick={
                  closeViewModal
                }
              >

                <X size={19} />

              </button>

            </header>


            {/* BODY */}

            <div className="user-details-body">

              {/* PROFILE */}

              <div className="user-profile-summary">

                <div className="user-profile-avatar">
                  {getProfileImage(selectedMember) ? (
                    <img
                      src={getProfileImage(selectedMember)}
                      alt={getName(selectedMember)}
                      onError={(event) => {
                        event.currentTarget.style.display =
                          "none";

                        const parent =
                          event.currentTarget.parentElement;

                        if (parent) {
                          parent.classList.add(
                            "user-avatar-image-error"
                          );
                        }
                      }}
                    />
                  ) : (
                    <User size={30} />
                  )}
                </div>

                <div>

                  <h3>
                    {
                      getName(
                        selectedMember
                      )
                    }
                  </h3>

                  <span>
                    @
                    {
                      getUsername(
                        selectedMember
                      )
                    }
                  </span>

                </div>

              </div>


              {/* PERSONAL */}

              <div className="user-detail-section">

                <div className="user-detail-section-title">

                  <User size={17} />

                  <span>
                    PERSONAL INFORMATION
                  </span>

                </div>


                <div className="user-detail-grid">

                  <div>

                    <span>
                      Full Name
                    </span>

                    <strong>
                      {
                        getName(
                          selectedMember
                        )
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Username
                    </span>

                    <strong>
                      @
                      {
                        getUsername(
                          selectedMember
                        )
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Age
                    </span>

                    <strong>
                      {
                        getAge(
                          selectedMember
                        )
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Gender
                    </span>

                    <strong>
                      {
                        getSex(
                          selectedMember
                        )
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Blood Group
                    </span>

                    <strong>
                      {
                        getBloodGroup(
                          selectedMember
                        )
                      }
                    </strong>

                  </div>

                </div>

              </div>


              {/* CONTACT */}

              <div className="user-detail-section">

                <div className="user-detail-section-title">

                  <Phone size={17} />

                  <span>
                    CONTACT INFORMATION
                  </span>

                </div>


                <div className="user-detail-grid">

                  <div>

                    <span>
                      Email
                    </span>

                    <strong>
                      {
                        getEmail(
                          selectedMember
                        )
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Mobile
                    </span>

                    <strong>
                      {
                        getMobile(
                          selectedMember
                        )
                      }
                    </strong>

                  </div>


                  <div className="user-detail-full">

                    <span>
                      Address
                    </span>

                    <strong>
                      <MapPin
                        size={14}
                      />

                      {
                        getAddress(
                          selectedMember
                        )
                      }

                    </strong>

                  </div>

                </div>

              </div>


              {/* ACCOUNT */}

              <div className="user-detail-section">

                <div className="user-detail-section-title">

                  <ShieldCheck
                    size={17}
                  />

                  <span>
                    ACCOUNT INFORMATION
                  </span>

                </div>


                <div className="user-detail-grid">

                  <div>

                    <span>
                      Member ID
                    </span>

                    <strong>
                      {
                        getMemberId(
                          selectedMember
                        )
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Registered
                    </span>

                    <strong>
                      {formatDateTime(
                        selectedMember.created_at
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Last Updated
                    </span>

                    <strong>
                      {formatDateTime(
                        selectedMember.updated_at
                      )}
                    </strong>

                  </div>

                </div>

              </div>


              {/* ACTIONS */}

              <div className="user-modal-actions">

                <button
                  type="button"
                  className="user-modal-edit"
                  onClick={() =>
                    startEdit(
                      selectedMember
                    )
                  }
                >

                  <Pencil
                    size={16}
                  />

                  Edit Member

                </button>


                <button
                  type="button"
                  className="user-modal-delete"
                  onClick={() =>
                    deleteMember(
                      selectedMember
                    )
                  }
                  disabled={
                    actionLoading
                  }
                >

                  <Trash2
                    size={16}
                  />

                  Delete Account

                </button>

              </div>

            </div>

          </section>

        </div>

      )}


      {/* =====================================================
          EDIT MEMBER MODAL
      ===================================================== */}

      {editingMember && (

        <div
          className="user-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeEditModal();
            }

          }}
        >

          <section
            className="user-edit-modal"
            role="dialog"
            aria-modal="true"
          >

            <header className="user-modal-header">

              <div>

                <span>
                  MEMBER MANAGEMENT
                </span>

                <h2>
                  Edit Member
                </h2>

              </div>

              <button
                type="button"
                onClick={
                  closeEditModal
                }
                disabled={
                  actionLoading
                }
              >

                <X size={19} />

              </button>

            </header>


            <form
              className="user-edit-form"
              onSubmit={
                updateMember
              }
            >

              {/* FULL NAME */}

              <div className="user-form-group">

                <label>
                  Full Name
                </label>

                <input
                  type="text"
                  name="fullName"
                  value={
                    editingMember.fullName
                  }
                  onChange={
                    handleEditChange
                  }
                  required
                />

              </div>


              {/* USERNAME */}

              <div className="user-form-group">

                <label>
                  Username
                </label>

                <input
                  type="text"
                  name="username"
                  value={
                    editingMember.username
                  }
                  onChange={
                    handleEditChange
                  }
                  required
                />

              </div>


              {/* EMAIL */}

              <div className="user-form-group">

                <label>
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={
                    editingMember.email
                  }
                  onChange={
                    handleEditChange
                  }
                  required
                />

              </div>


              {/* MOBILE */}

              <div className="user-form-group">

                <label>
                  Mobile
                </label>

                <input
                  type="tel"
                  name="mobile"
                  value={
                    editingMember.mobile
                  }
                  onChange={
                    handleEditChange
                  }
                  maxLength={10}
                  required
                />

              </div>


              {/* AGE */}

              <div className="user-form-group">

                <label>
                  Age
                </label>

                <input
                  type="number"
                  name="age"
                  value={
                    editingMember.age
                  }
                  onChange={
                    handleEditChange
                  }
                  min="1"
                  max="120"
                  required
                />

              </div>


              {/* GENDER */}

              <div className="user-form-group">

                <label>
                  Gender
                </label>

                <select
                  name="sex"
                  value={
                    editingMember.sex
                  }
                  onChange={
                    handleEditChange
                  }
                  required
                >

                  <option value="">
                    Select Gender
                  </option>

                  <option value="Male">
                    Male
                  </option>

                  <option value="Female">
                    Female
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>


              {/* BLOOD GROUP */}

              <div className="user-form-group">

                <label>
                  Blood Group
                </label>

                <select
                  name="bloodGroup"
                  value={
                    editingMember.bloodGroup
                  }
                  onChange={
                    handleEditChange
                  }
                  required
                >

                  <option value="">
                    Select Blood Group
                  </option>

                  <option value="A+">
                    A+
                  </option>

                  <option value="A-">
                    A-
                  </option>

                  <option value="B+">
                    B+
                  </option>

                  <option value="B-">
                    B-
                  </option>

                  <option value="AB+">
                    AB+
                  </option>

                  <option value="AB-">
                    AB-
                  </option>

                  <option value="O+">
                    O+
                  </option>

                  <option value="O-">
                    O-
                  </option>

                </select>

              </div>


              {/* ADDRESS */}

              <div className="user-form-group user-form-full">

                <label>
                  Address
                </label>

                <textarea
                  name="address"
                  value={
                    editingMember.address
                  }
                  onChange={
                    handleEditChange
                  }
                  rows={4}
                  required
                />

              </div>


              {/* FORM ACTIONS */}

              <div className="user-edit-actions">

                <button
                  type="button"
                  className="user-form-cancel"
                  onClick={
                    closeEditModal
                  }
                  disabled={
                    actionLoading
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="user-form-submit"
                  disabled={
                    actionLoading
                  }
                >

                  {actionLoading
                    ? "Saving..."
                    : "Save Changes"}

                </button>

              </div>

            </form>

          </section>

        </div>

      )}

    </main>
  );
}

export default UserManagement;