"use client";

import { useEffect, useState } from "react";
import { account, database, Query, ID } from "@/lib/appwrite";
import Student from "@/interface/interface";

export default function Page() {
  const [user, setuser] = useState<any | null>(null);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [students, setStudents] = useState<Student[]>([]);

  const [studentNumber, setStudentNumber] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastname] = useState<string>("");
  const [section, setSection] = useState<string>("");
  const [gradeLevel, setGradeLevel] = useState<number>(1);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      await refreshUser();
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    loadStudents();
  }, [user?.$id]);

  async function refreshUser() {
    try {
      const me = await account.get();
      setuser(me);
    } catch {
      setuser(null);
    }
  }

  async function login() {
    try {
      await account.createEmailPasswordSession(email, password);
      await refreshUser();
    } catch (e: any) {
      setError(e.message ?? "Authentication Failed!");
    }
  }

  async function loginWithAuth0() {
    try {
      await account.createOAuth2Session({
        provider: "auth0",
        success: `${process.env.NEXT_PUBLIC_APP_URL!}`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL!}`,
        scopes: ["openid", "profile", "email"],
      });
    } catch (e: any) {
      setError(e.message ?? "Auth 0 login failed");
    }
  }

  async function logout() {
    await account.deleteSession("current");
    setuser(null);
  }

  if (!user) {
    return (
      <>
        <main
          style={{
            maxWidth: 520,
            margin: "40px auto",
            display: "grid",
            gap: 12,
          }}
        >
          <h1>Login</h1>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: 8 }}
          />
          <input
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: 8 }}
            type="password"
          />
          <button onClick={login} style={{ padding: 8 }}>
            Login
          </button>
          <div style={{ textAlign: "center", color: "#666", margin: "8px 0" }}>
            - or -
          </div>
          <button onClick={loginWithAuth0} style={{ padding: 8 }}>
            Login with Auth0
          </button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </main>
      </>
    );
  }

  async function loadStudents() {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const response = await database.listDocuments("angelicum", "student", [
        Query.orderDesc("$createdAt"),
      ]);
      setStudents(response.documents as any);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function add() {
    try {
      await database.createDocument("angelicum", "student", ID.unique(), {
        StudentNumber: studentNumber,
        FirstName: firstName,
        LastName: lastName,
        Section: section,
        GradeLevel: gradeLevel,
      });
      await loadStudents();
    } catch {}
  }

  async function remove(id: string) {
    try {
      await database.deleteDocument("angelicum", "student", id);
      await loadStudents();
    } catch {}
  }
  return (
    <>
      <main
        style={{
          maxWidth: 1000,
          margin: "40px auto",
          display: "grid",
          gap: 12,
        }}
      >
        <h1>Students List</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={studentNumber}
            placeholder="Student number"
            onChange={(e) => setStudentNumber(e.target.value)}
          ></input>
          <input
            value={firstName}
            placeholder="First Name"
            onChange={(e) => setFirstName(e.target.value)}
          ></input>
          <input
            value={lastName}
            placeholder="Last Name"
            onChange={(e) => setLastname(e.target.value)}
          ></input>
          <input
            value={section}
            placeholder="Section"
            onChange={(e) => setSection(e.target.value)}
          ></input>
          <input
            value={gradeLevel}
            placeholder="Grade Level"
            onChange={(e) => setGradeLevel(parseInt(e.target.value))}
          ></input>
          <button onClick={add}>Add</button>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={logout}>Logout</button>
          <span style={{ color: "#666" }}>Logged in as {user?.email}</span>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p style={{ color: "red" }}> {error}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <td>Student Number</td>
                <td>First Name</td>
                <td>Last Name</td>
                <td>Section</td>
                <td>Grade Level</td>
                <td></td>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.$id}>
                  <td>{student.StudentNumber}</td>
                  <td>{student.FirstName}</td>
                  <td>{student.LastName}</td>
                  <td>{student.Section}</td>
                  <td>{student.GradeLevel}</td>
                  <td>
                    <button onClick={() => remove(student.$id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </>
  );
}
