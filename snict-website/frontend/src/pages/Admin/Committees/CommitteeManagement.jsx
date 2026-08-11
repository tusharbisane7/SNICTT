import { useEffect, useState } from "react";

import {
  Plus,
  Pencil,
  Trash2,
  X,
  Users,
  RefreshCw,
  CheckCircle2,
  Eye,
  EyeOff,
  Image as ImageIcon,
} from "lucide-react";

import api from "../../../services/api";

import "./CommitteeManagement.css";


// =========================================================
// VALID COMMITTEES
// =========================================================

const COMMITTEES = [
  "Placement Committee",
  "Academic Committee",
  "Compliance Committee",
  "Working Committee",
];


// =========================================================
// EMPTY FORM
// =========================================================

const EMPTY_FORM = {
  committeeName: "",
  memberName: "",
  designation: "",
  bio: "",
  qualification: "",
  displayOrder: 0,
  isActive: true,
  photo: null,
};


// =========================================================
// COMPONENT
// =========================================================

function CommitteeManagement() {

  // =======================================================
  // STATES
  // =======================================================

  const [members, setMembers] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [form, setForm] =
    useState({
      ...EMPTY_FORM,
    });

  // Existing backend image
  const [existingPhoto, setExistingPhoto] =
    useState("");

  // Local selected image preview
  const [photoPreview, setPhotoPreview] =
    useState("");


  // =======================================================
  // API BASE URL
  // =======================================================

  const getApiBaseUrl = () => {

    const baseURL =
      api?.defaults?.baseURL || "";

    return String(baseURL)
      .replace(/\/+$/, "")
      .replace(/\/api$/, "");

  };


  // =======================================================
  // GET FULL IMAGE URL
  // =======================================================

  const getImageUrl = (photo) => {

    if (!photo) {
      return "";
    }

    const value =
      String(photo).trim();

    if (!value) {
      return "";
    }

    // -----------------------------------------------------
    // Already absolute URL
    // -----------------------------------------------------

    if (
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("blob:")
    ) {
      return value;
    }

    const apiBaseUrl =
      getApiBaseUrl();

    // -----------------------------------------------------
    // Backend path
    // Example:
    // /uploads/committee/file.jpg
    // -----------------------------------------------------

    if (value.startsWith("/")) {

      return `${apiBaseUrl}${value}`;

    }

    // -----------------------------------------------------
    // Relative backend path
    // Example:
    // uploads/committee/file.jpg
    // -----------------------------------------------------

    return `${apiBaseUrl}/${value}`;

  };


  // =======================================================
  // LOAD MEMBERS
  // =======================================================

  const loadMembers = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await api.get(
          "/committees/admin"
        );

      const data =
        response.data?.members || [];

      setMembers(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (error) {

      console.error(
        "Load committee members error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to load committee members."
      );

    } finally {

      setLoading(false);

    }

  };


  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {

    loadMembers();

  }, []);


  // =======================================================
  // CLEAR MESSAGES
  // =======================================================

  const clearMessages = () => {

    setError("");
    setSuccess("");

  };


  // =======================================================
  // FORM CHANGE
  // =======================================================

  const handleChange = (event) => {

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


  // =======================================================
  // PHOTO CHANGE
  // =======================================================

  const handlePhotoChange = (event) => {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    // -----------------------------------------------------
    // VALIDATE IMAGE TYPE
    // -----------------------------------------------------

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {

      setError(
        "Only JPG, JPEG, PNG and WEBP images are allowed."
      );

      event.target.value = "";

      return;
    }


    // -----------------------------------------------------
    // VALIDATE IMAGE SIZE
    // -----------------------------------------------------

    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {

      setError(
        "Image size must be 5 MB or less."
      );

      event.target.value = "";

      return;
    }


    clearMessages();


    // -----------------------------------------------------
    // REVOKE OLD PREVIEW
    // -----------------------------------------------------

    if (photoPreview) {

      URL.revokeObjectURL(
        photoPreview
      );

    }


    // -----------------------------------------------------
    // SAVE FILE
    // -----------------------------------------------------

    setForm((previous) => ({
      ...previous,
      photo: file,
    }));


    // -----------------------------------------------------
    // CREATE PREVIEW
    // -----------------------------------------------------

    const previewUrl =
      URL.createObjectURL(file);

    setPhotoPreview(
      previewUrl
    );

  };


  // =======================================================
  // REMOVE SELECTED PHOTO
  // =======================================================

  const removeSelectedPhoto = () => {

    if (photoPreview) {

      URL.revokeObjectURL(
        photoPreview
      );

    }

    setForm((previous) => ({
      ...previous,
      photo: null,
    }));

    setPhotoPreview("");


    // Reset file input
    const fileInput =
      document.getElementById(
        "committee-photo"
      );

    if (fileInput) {
      fileInput.value = "";
    }

  };


  // =======================================================
  // RESET FORM
  // =======================================================

  const resetForm = () => {

    if (photoPreview) {

      URL.revokeObjectURL(
        photoPreview
      );

    }

    setForm({
      ...EMPTY_FORM,
    });

    setExistingPhoto("");

    setPhotoPreview("");

    setEditingId(null);

    setShowForm(false);

  };


  // =======================================================
  // OPEN ADD FORM
  // =======================================================

  const openAddForm = () => {

    clearMessages();

    setEditingId(null);

    setExistingPhoto("");

    if (photoPreview) {

      URL.revokeObjectURL(
        photoPreview
      );

    }

    setPhotoPreview("");

    setForm({
      ...EMPTY_FORM,
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  };


  // =======================================================
  // EDIT MEMBER
  // =======================================================

  const handleEdit = (member) => {

    clearMessages();

    setEditingId(
      member.id
    );

    setForm({
      committeeName:
        member.committeeName || "",

      memberName:
        member.memberName || "",

      designation:
        member.designation || "",

      bio:
        member.bio || "",

      qualification:
        member.qualification || "",

      displayOrder:
        member.displayOrder ?? 0,

      isActive:
        member.isActive ?? true,

      photo: null,
    });


    // -----------------------------------------------------
    // Existing backend image
    // -----------------------------------------------------

    const backendPhoto =
      member.photoUrl ||
      member.photo ||
      member.imageUrl ||
      member.image ||
      "";

    setExistingPhoto(
      getImageUrl(
        backendPhoto
      )
    );


    if (photoPreview) {

      URL.revokeObjectURL(
        photoPreview
      );

    }

    setPhotoPreview("");

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  };


  // =======================================================
  // VALIDATE FORM
  // =======================================================

  const validateForm = () => {

    const committeeName =
      String(
        form.committeeName || ""
      ).trim();

    const memberName =
      String(
        form.memberName || ""
      ).trim();

    const designation =
      String(
        form.designation || ""
      ).trim();

    const bio =
      String(
        form.bio || ""
      ).trim();

    const qualification =
      String(
        form.qualification || ""
      ).trim();


    // -----------------------------------------------------
    // COMMITTEE
    // -----------------------------------------------------

    if (!committeeName) {

      setError(
        "Please select a committee."
      );

      return false;
    }


    if (
      !COMMITTEES.includes(
        committeeName
      )
    ) {

      setError(
        "Please select a valid committee."
      );

      return false;
    }


    // -----------------------------------------------------
    // MEMBER NAME
    // -----------------------------------------------------

    if (!memberName) {

      setError(
        "Member name is required."
      );

      return false;
    }


    if (
      memberName.length > 150
    ) {

      setError(
        "Member name cannot exceed 150 characters."
      );

      return false;
    }


    // -----------------------------------------------------
    // DESIGNATION
    // -----------------------------------------------------

    if (
      designation.length > 150
    ) {

      setError(
        "Designation cannot exceed 150 characters."
      );

      return false;
    }


    // -----------------------------------------------------
    // BIO
    // -----------------------------------------------------

    if (
      bio.length > 2000
    ) {

      setError(
        "Bio cannot exceed 2000 characters."
      );

      return false;
    }


    // -----------------------------------------------------
    // QUALIFICATION
    // -----------------------------------------------------

    if (
      qualification.length > 250
    ) {

      setError(
        "Qualification cannot exceed 250 characters."
      );

      return false;
    }


    // -----------------------------------------------------
    // DISPLAY ORDER
    // -----------------------------------------------------

    const order =
      Number(
        form.displayOrder
      );

    if (
      !Number.isInteger(order) ||
      order < 0
    ) {

      setError(
        "Display order must be a valid number greater than or equal to 0."
      );

      return false;
    }


    return true;

  };


  // =======================================================
  // SAVE MEMBER
  // =======================================================

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    clearMessages();


    if (!validateForm()) {
      return;
    }


    try {

      setSaving(true);


      // =================================================
      // CREATE FORM DATA
      // =================================================

      const formData =
        new FormData();


      formData.append(
        "committeeName",
        String(
          form.committeeName
        ).trim()
      );


      formData.append(
        "memberName",
        String(
          form.memberName
        ).trim()
      );


      formData.append(
        "designation",
        String(
          form.designation || ""
        ).trim()
      );


      formData.append(
        "bio",
        String(
          form.bio || ""
        ).trim()
      );


      formData.append(
        "qualification",
        String(
          form.qualification || ""
        ).trim()
      );


      formData.append(
        "displayOrder",
        String(
          Number(
            form.displayOrder || 0
          )
        )
      );


      formData.append(
        "isActive",
        String(
          Boolean(
            form.isActive
          )
        )
      );


      // =================================================
      // PROFILE PHOTO
      // =================================================

      if (form.photo) {

        formData.append(
          "photo",
          form.photo
        );

      }


      // =================================================
      // UPDATE
      // =================================================

      if (editingId) {

        const response =
          await api.put(
            `/committees/admin/${editingId}`,
            formData
          );

        setSuccess(
          response.data?.message ||
          "Committee member updated successfully."
        );

      }


      // =================================================
      // ADD
      // =================================================

      else {

        // Photo required for new member
        if (!form.photo) {

          setError(
            "Please select a profile photo."
          );

          setSaving(false);

          return;
        }


        const response =
          await api.post(
            "/committees/admin",
            formData
          );

        setSuccess(
          response.data?.message ||
          "Committee member added successfully."
        );

      }


      // =================================================
      // RELOAD MEMBERS
      // =================================================

      await loadMembers();


      // =================================================
      // RESET
      // =================================================

      resetForm();

    } catch (error) {

      console.error(
        "Save committee member error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to save committee member."
      );

    } finally {

      setSaving(false);

    }

  };


  // =======================================================
  // DELETE MEMBER
  // =======================================================

  const handleDelete = async (
    id
  ) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to permanently delete this committee member?"
      );

    if (!confirmed) {
      return;
    }


    try {

      clearMessages();

      setDeletingId(id);


      const response =
        await api.delete(
          `/committees/admin/${id}`
        );


      setSuccess(
        response.data?.message ||
        "Committee member deleted successfully."
      );


      await loadMembers();

    } catch (error) {

      console.error(
        "Delete committee member error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to delete committee member."
      );

    } finally {

      setDeletingId(null);

    }

  };


  // =======================================================
  // GROUP MEMBERS
  // =======================================================

  const groupedMembers =
    members.reduce(
      (groups, member) => {

        const committeeName =
          member.committeeName ||
          "Other";


        if (
          !groups[committeeName]
        ) {

          groups[committeeName] =
            [];

        }


        groups[
          committeeName
        ].push(member);


        return groups;

      },
      {}
    );


  // =======================================================
  // COMMITTEE ORDER
  // =======================================================

  const orderedGroups =
    COMMITTEES.map(
      (committeeName) => [

        committeeName,

        groupedMembers[
          committeeName
        ] || [],

      ]
    );


  // =======================================================
  // GET MEMBER PHOTO
  // =======================================================

  const getMemberPhoto = (
    member
  ) => {

    const photo =
      member.photoUrl ||
      member.photo ||
      member.imageUrl ||
      member.image ||
      "";

    return getImageUrl(
      photo
    );

  };


  // =======================================================
  // IMAGE ERROR
  // =======================================================

  const handleMemberImageError = (
    event
  ) => {

    event.currentTarget.style.display =
      "none";

    const fallback =
      event.currentTarget
        .parentElement
        ?.querySelector(
          ".committee-photo-fallback"
        );

    if (fallback) {

      fallback.style.display =
        "flex";

    }

  };


  // =======================================================
  // RENDER
  // =======================================================

  return (

    <main className="committee-admin-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="committee-admin-header">

        <div className="committee-header-content">

          <span className="admin-label">
            SNICT ADMINISTRATION
          </span>

          <h1>
            Committee Management
          </h1>

          <p>
            Manage Placement, Academic,
            Compliance and Working Committee
            members from one place.
          </p>

        </div>


        <div className="committee-header-actions">

          <button
            type="button"
            className="committee-refresh-button"
            onClick={
              loadMembers
            }
            disabled={loading}
          >

            <RefreshCw
              size={18}
              className={
                loading
                  ? "committee-spin"
                  : ""
              }
            />

            Refresh

          </button>


          <button
            type="button"
            className="committee-add-button"
            onClick={
              openAddForm
            }
          >

            <Plus size={19} />

            Add Member

          </button>

        </div>

      </header>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (

        <div className="committee-message error">

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >

            <X size={16} />

          </button>

        </div>

      )}


      {/* =====================================================
          SUCCESS
      ===================================================== */}

      {success && (

        <div className="committee-message success">

          <CheckCircle2
            size={19}
          />

          <span>
            {success}
          </span>

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
          >

            <X size={16} />

          </button>

        </div>

      )}


      {/* =====================================================
          FORM
      ===================================================== */}

      {showForm && (

        <section className="committee-form-card">

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

              <p>
                Enter member information
                and upload the profile photo
                directly from your computer.
              </p>

            </div>


            <button
              type="button"
              onClick={
                resetForm
              }
              className="committee-close"
              aria-label="Close form"
              disabled={saving}
            >

              <X size={21} />

            </button>

          </div>


          <form
            onSubmit={
              handleSubmit
            }
            className="committee-form"
          >

            <div className="committee-form-grid">

              {/* =================================================
                  COMMITTEE
              ================================================= */}

              <div className="committee-field">

                <label>
                  Committee
                  <span>*</span>
                </label>

                <select
                  name="committeeName"
                  value={
                    form.committeeName
                  }
                  onChange={
                    handleChange
                  }
                  required
                >

                  <option value="">
                    Select Committee
                  </option>

                  {COMMITTEES.map(
                    (committee) => (

                      <option
                        key={committee}
                        value={committee}
                      >
                        {committee}
                      </option>

                    )
                  )}

                </select>

              </div>


              {/* =================================================
                  MEMBER NAME
              ================================================= */}

              <div className="committee-field">

                <label>
                  Member Name
                  <span>*</span>
                </label>

                <input
                  name="memberName"
                  value={
                    form.memberName
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter full member name"
                  maxLength={150}
                  required
                />

              </div>


              {/* =================================================
                  DESIGNATION
              ================================================= */}

              <div className="committee-field">

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
                  placeholder="e.g. Chairman, Secretary"
                  maxLength={150}
                />

              </div>


              {/* =================================================
                  QUALIFICATION
              ================================================= */}

              <div className="committee-field">

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
                  placeholder="e.g. B.Tech, M.Tech"
                  maxLength={250}
                />

              </div>


              {/* =================================================
                  BIO
              ================================================= */}

              <div className="committee-field committee-field-full">

                <label>
                  Bio
                </label>

                <textarea
                  name="bio"
                  value={
                    form.bio
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Write a short professional biography..."
                  maxLength={2000}
                  rows={5}
                />

                <small>
                  Maximum 2000 characters.
                </small>

              </div>


              {/* =================================================
                  PROFILE PHOTO
              ================================================= */}

              <div className="committee-field committee-field-full">

                <label>
                  Profile Photo

                  {!editingId && (
                    <span>*</span>
                  )}

                </label>


                <div className="committee-file-upload">

                  <input
                    id="committee-photo"
                    type="file"
                    name="photo"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={
                      handlePhotoChange
                    }
                  />


                  <label
                    htmlFor="committee-photo"
                    className="committee-file-label"
                  >

                    <ImageIcon
                      size={22}
                    />

                    <span>

                      {form.photo
                        ? form.photo.name
                        : "Browse Profile Photo"}

                    </span>

                  </label>

                </div>


                <small>
                  JPG, JPEG, PNG or WEBP.
                  Maximum 5 MB.
                </small>

              </div>


              {/* =================================================
                  PHOTO PREVIEW
              ================================================= */}

              {(photoPreview ||
                existingPhoto) && (

                <div className="committee-photo-preview">

                  <div className="committee-preview-image">

                    <img
                      src={
                        photoPreview ||
                        existingPhoto
                      }
                      alt="Profile preview"
                      onError={(event) => {

                        event.currentTarget.style.display =
                          "none";

                        const fallback =
                          event.currentTarget
                            .parentElement
                            ?.querySelector(
                              ".committee-preview-fallback"
                            );

                        if (fallback) {

                          fallback.style.display =
                            "flex";

                        }

                      }}
                    />

                    <div
                      className="committee-preview-fallback"
                      style={{
                        display: "none",
                      }}
                    >

                      <Users
                        size={32}
                      />

                    </div>

                  </div>


                  <div className="committee-preview-info">

                    <span>
                      PROFILE PHOTO
                    </span>

                    <strong>
                      {form.memberName ||
                        "Member Photo"}
                    </strong>

                    <p>

                      {form.photo
                        ? "New photo selected. It will replace the existing photo."
                        : "Current profile photo."}

                    </p>


                    {form.photo && (

                      <button
                        type="button"
                        onClick={
                          removeSelectedPhoto
                        }
                        className="committee-remove-photo"
                      >

                        <X size={14} />

                        Remove New Photo

                      </button>

                    )}

                  </div>

                </div>

              )}


              {/* =================================================
                  DISPLAY ORDER
              ================================================= */}

              <div className="committee-field">

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
                  step="1"
                />

                <small>
                  Lower numbers appear first.
                </small>

              </div>

            </div>


            {/* =================================================
                ACTIVE
            ================================================= */}

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

              <span className="committee-active-icon">

                {form.isActive ? (

                  <Eye size={17} />

                ) : (

                  <EyeOff size={17} />

                )}

              </span>

              <span className="committee-active-text">

                <strong>
                  Show this member publicly
                </strong>

                <small>

                  {form.isActive
                    ? "This member is visible on the website."
                    : "This member is hidden from the website."}

                </small>

              </span>

            </label>


            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className="committee-form-actions">

              <button
                type="button"
                className="committee-cancel"
                onClick={
                  resetForm
                }
                disabled={saving}
              >

                Cancel

              </button>


              <button
                type="submit"
                className="committee-save"
                disabled={saving}
              >

                {saving ? (

                  <>

                    <RefreshCw
                      size={17}
                      className="committee-spin"
                    />

                    Saving...

                  </>

                ) : (

                  <>

                    {editingId ? (
                      <Pencil size={17} />
                    ) : (
                      <Plus size={17} />
                    )}

                    {editingId
                      ? "Update Member"
                      : "Add Member"}

                  </>

                )}

              </button>

            </div>

          </form>

        </section>

      )}


      {/* =====================================================
          MEMBERS
      ===================================================== */}

      <section className="committee-groups">

        {loading ? (

          <div className="committee-loading">

            <RefreshCw
              size={28}
              className="committee-spin"
            />

            <h3>
              Loading committee members...
            </h3>

            <p>
              Please wait while the latest
              committee data is loaded.
            </p>

          </div>

        ) : (

          orderedGroups.map(
            ([
              committeeName,
              committeeMembers,
            ]) => (

              <section
                className="committee-group"
                key={committeeName}
              >

                {/* =================================================
                    GROUP HEADER
                ================================================= */}

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


                {/* =================================================
                    EMPTY
                ================================================= */}

                {committeeMembers.length === 0 ? (

                  <div className="committee-group-empty">

                    <Users
                      size={27}
                    />

                    <div>

                      <h3>
                        No members added
                      </h3>

                      <p>
                        Add members to this
                        committee using the
                        button above.
                      </p>

                    </div>

                  </div>

                ) : (

                  <div className="committee-member-list">

                    {committeeMembers.map(
                      (member) => {

                        const photo =
                          getMemberPhoto(
                            member
                          );

                        const name =
                          member.memberName ||
                          "Unnamed Member";

                        const designation =
                          member.designation ||
                          "Committee Member";

                        const bio =
                          member.bio ||
                          "";

                        const qualification =
                          member.qualification ||
                          "";

                        const isActive =
                          member.isActive ??
                          true;


                        return (

                          <article
                            className={`committee-member-card ${
                              !isActive
                                ? "inactive"
                                : ""
                            }`}
                            key={
                              member.id
                            }
                          >

                            {/* =================================================
                                PHOTO
                            ================================================= */}

                            <div className="committee-member-photo">

                              {photo ? (

                                <img
                                  src={photo}
                                  alt={name}
                                  loading="lazy"
                                  onError={
                                    handleMemberImageError
                                  }
                                />

                              ) : null}


                              <div
                                className="committee-photo-fallback"
                                style={{
                                  display:
                                    photo
                                      ? "none"
                                      : "flex",
                                }}
                              >

                                <Users
                                  size={30}
                                />

                              </div>

                            </div>


                            {/* =================================================
                                INFO
                            ================================================= */}

                            <div className="committee-member-info">

                              <span className="committee-member-tag">

                                {isActive ? (

                                  <>

                                    <CheckCircle2
                                      size={13}
                                    />

                                    ACTIVE

                                  </>

                                ) : (

                                  <>

                                    <EyeOff
                                      size={13}
                                    />

                                    HIDDEN

                                  </>

                                )}

                              </span>


                              <h3>
                                {name}
                              </h3>


                              <strong>
                                {designation}
                              </strong>


                              {qualification && (

                                <small>
                                  {qualification}
                                </small>

                              )}


                              {bio && (

                                <p className="committee-member-bio">
                                  {bio}
                                </p>

                              )}

                            </div>


                            {/* =================================================
                                ACTIONS
                            ================================================= */}

                            <div className="committee-member-actions">

                              <button
                                type="button"
                                onClick={() =>
                                  handleEdit(
                                    member
                                  )
                                }
                                title="Edit member"
                              >

                                <Pencil
                                  size={17}
                                />

                                <span>
                                  Edit
                                </span>

                              </button>


                              <button
                                type="button"
                                className="delete"
                                onClick={() =>
                                  handleDelete(
                                    member.id
                                  )
                                }
                                disabled={
                                  deletingId ===
                                  member.id
                                }
                                title="Delete member"
                              >

                                {deletingId ===
                                member.id ? (

                                  <RefreshCw
                                    size={17}
                                    className="committee-spin"
                                  />

                                ) : (

                                  <Trash2
                                    size={17}
                                  />

                                )}

                                <span>
                                  Delete
                                </span>

                              </button>

                            </div>

                          </article>

                        );

                      }
                    )}

                  </div>

                )}

              </section>

            )
          )

        )}

      </section>

    </main>

  );

}


export default CommitteeManagement;