import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Users,
} from "lucide-react";

import api from "../../../services/api";

import "./CommitteeManagement.css";

function CommitteeManagement() {

  const [members, setMembers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [form, setForm] = useState({
    committeeName: "",
    memberName: "",
    designation: "",
    qualification: "",
    photoUrl: "",
    displayOrder: 0,
    isActive: true,
  });

  // =====================================================
  // LOAD
  // =====================================================

  const loadMembers = async () => {
    try {
      setLoading(true);

      const response =
        await api.get(
          "/committees/admin"
        );

      setMembers(
        response.data?.members || []
      );

    } catch (error) {
      console.error(
        "Load committee members error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to load committee members"
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // =====================================================
  // FORM
  // =====================================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => ({
      ...previous,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // =====================================================
  // RESET
  // =====================================================

  const resetForm = () => {
    setForm({
      committeeName: "",
      memberName: "",
      designation: "",
      qualification: "",
      photoUrl: "",
      displayOrder: 0,
      isActive: true,
    });

    setEditingId(null);
    setShowForm(false);
  };

  // =====================================================
  // EDIT
  // =====================================================

  const handleEdit = (
    member
  ) => {
    setEditingId(member.id);

    setForm({
      committeeName:
        member.committee_name || "",

      memberName:
        member.member_name || "",

      designation:
        member.designation || "",

      qualification:
        member.qualification || "",

      photoUrl:
        member.photo_url || "",

      displayOrder:
        member.display_order || 0,

      isActive:
        member.is_active,
    });

    setShowForm(true);
  };

  // =====================================================
  // SAVE
  // =====================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.committeeName.trim() ||
      !form.memberName.trim()
    ) {
      setError(
        "Committee name and member name are required."
      );

      return;
    }

    try {
      setSaving(true);

      if (editingId) {

        const response =
          await api.put(
            `/committees/${editingId}`,
            form
          );

        setSuccess(
          response.data?.message ||
          "Member updated successfully"
        );

      } else {

        const response =
          await api.post(
            "/committees",
            form
          );

        setSuccess(
          response.data?.message ||
          "Member added successfully"
        );
      }

      resetForm();

      await loadMembers();

    } catch (error) {
      console.error(
        "Save committee member error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to save committee member"
      );

    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (
    id
  ) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this committee member?"
      );

    if (!confirmed) {
      return;
    }

    try {

      setError("");
      setSuccess("");

      await api.delete(
        `/committees/${id}`
      );

      setSuccess(
        "Committee member deleted successfully"
      );

      await loadMembers();

    } catch (error) {

      console.error(
        "Delete committee member error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to delete committee member"
      );
    }
  };

  // =====================================================
  // GROUP MEMBERS
  // =====================================================

  const groupedMembers =
    members.reduce(
      (groups, member) => {

        const name =
          member.committee_name;

        if (!groups[name]) {
          groups[name] = [];
        }

        groups[name].push(
          member
        );

        return groups;

      },
      {}
    );

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="committee-admin-page">

      <div className="committee-admin-header">

        <div>

          <span className="admin-label">
            SNICT ADMINISTRATION
          </span>

          <h1>
            Committee Management
          </h1>

          <p>
            Add, edit or remove committee
            members from the SNICT website.
          </p>

        </div>

        <button
          className="committee-add-button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus size={17} />
          Add Member
        </button>

      </div>

      {error && (
        <div className="committee-message error">
          {error}
        </div>
      )}

      {success && (
        <div className="committee-message success">
          {success}
        </div>
      )}

      {/* =================================================
          FORM
      ================================================= */}

      {showForm && (

        <div className="committee-form-card">

          <div className="committee-form-header">

            <div>
              <span>
                {editingId
                  ? "EDIT MEMBER"
                  : "NEW MEMBER"}
              </span>

              <h2>
                {editingId
                  ? "Edit Committee Member"
                  : "Add Committee Member"}
              </h2>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="committee-close"
            >
              <X size={19} />
            </button>

          </div>

          <form
            onSubmit={handleSubmit}
            className="committee-form"
          >

            <div className="committee-form-grid">

              <div>
                <label>
                  Committee
                </label>

                <input
                  name="committeeName"
                  value={
                    form.committeeName
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. Academic Committee"
                  required
                />
              </div>

              <div>
                <label>
                  Member Name
                </label>

                <input
                  name="memberName"
                  value={
                    form.memberName
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter member name"
                  required
                />
              </div>

              <div>
                <label>
                  Designation
                </label>

                <input
                  name="designation"
                  value={
                    form.designation
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. Chairman"
                />
              </div>

              <div>
                <label>
                  Qualification
                </label>

                <input
                  name="qualification"
                  value={
                    form.qualification
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. B.Sc., M.Sc."
                />
              </div>

              <div>
                <label>
                  Photo URL
                </label>

                <input
                  name="photoUrl"
                  value={
                    form.photoUrl
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="https://..."
                />
              </div>

              <div>
                <label>
                  Display Order
                </label>

                <input
                  type="number"
                  name="displayOrder"
                  value={
                    form.displayOrder
                  }
                  onChange={
                    handleChange
                  }
                  min="0"
                />
              </div>

            </div>

            <label className="committee-active">

              <input
                type="checkbox"
                name="isActive"
                checked={
                  form.isActive
                }
                onChange={
                  handleChange
                }
              />

              <span>
                Show this member publicly
              </span>

            </label>

            <div className="committee-form-actions">

              <button
                type="button"
                className="committee-cancel"
                onClick={resetForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="committee-save"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Member"
                  : "Add Member"}
              </button>

            </div>

          </form>

        </div>
      )}

      {/* =================================================
          MEMBERS
      ================================================= */}

      <div className="committee-groups">

        {loading ? (

          <div className="committee-loading">
            Loading committee members...
          </div>

        ) : Object.keys(
            groupedMembers
          ).length === 0 ? (

          <div className="committee-empty">
            <Users size={35} />

            <h3>
              No committee members
            </h3>

            <p>
              Add your first committee member.
            </p>
          </div>

        ) : (

          Object.entries(
            groupedMembers
          ).map(
            ([
              committeeName,
              committeeMembers,
            ]) => (

              <section
                className="committee-group"
                key={committeeName}
              >

                <div className="committee-group-title">

                  <div>
                    <span>
                      COMMITTEE
                    </span>

                    <h2>
                      {committeeName}
                    </h2>
                  </div>

                  <strong>
                    {committeeMembers.length}
                  </strong>

                </div>

                <div className="committee-member-list">

                  {committeeMembers.map(
                    (member) => (

                      <article
                        className="committee-member-card"
                        key={member.id}
                      >

                        <div className="committee-member-photo">

                          {member.photo_url ? (
                            <img
                              src={
                                member.photo_url
                              }
                              alt={
                                member.member_name
                              }
                            />
                          ) : (
                            <Users size={23} />
                          )}

                        </div>

                        <div className="committee-member-info">

                          <h3>
                            {member.member_name}
                          </h3>

                          {member.designation && (
                            <span>
                              {member.designation}
                            </span>
                          )}

                          {member.qualification && (
                            <small>
                              {
                                member.qualification
                              }
                            </small>
                          )}

                        </div>

                        <div className="committee-member-actions">

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                member
                              )
                            }
                            title="Edit"
                          >
                            <Pencil
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            className="delete"
                            onClick={() =>
                              handleDelete(
                                member.id
                              )
                            }
                            title="Delete"
                          >
                            <Trash2
                              size={16}
                            />
                          </button>

                        </div>

                      </article>

                    )
                  )}

                </div>

              </section>

            )
          )

        )}

      </div>

    </main>
  );
}

export default CommitteeManagement;