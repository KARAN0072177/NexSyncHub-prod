import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Button,
  Heading,
  Section,
} from "@react-email/components";

export default function TaskAssignedEmail({
  username,
  taskTitle,
  assignedBy,
  link,
}: {
  username: string;
  taskTitle: string;
  assignedBy: string;
  link: string;
}) {
  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>New Task Assigned</Heading>

          <Text style={styles.text}>Hi {username},</Text>

          <Text style={styles.text}>
            <b>{assignedBy}</b> assigned you a new task:
          </Text>

          <Section style={styles.taskBox}>
            <Text style={styles.taskText}>{taskTitle}</Text>
          </Section>

          <Button href={link} style={styles.button}>
            View Task
          </Button>

          <Text style={styles.footer}>
            You’re receiving this because you’re part of a workspace on NexSyncHub.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#0f172a",
    fontFamily: "Arial, sans-serif",
    padding: "20px",
  },
  container: {
    backgroundColor: "#111827",
    borderRadius: "8px",
    padding: "24px",
    maxWidth: "500px",
    margin: "0 auto",
    border: "1px solid #1f2937",
  },
  heading: {
    color: "#fff",
    fontSize: "20px",
    marginBottom: "16px",
  },
  text: {
    color: "#d1d5db",
    fontSize: "14px",
    marginBottom: "12px",
  },
  taskBox: {
    backgroundColor: "#1f2937",
    padding: "12px",
    borderRadius: "6px",
    marginBottom: "16px",
  },
  taskText: {
    color: "#fff",
    fontSize: "14px",
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#6366f1",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "6px",
    textDecoration: "none",
    display: "inline-block",
  },
  footer: {
    color: "#6b7280",
    fontSize: "12px",
    marginTop: "20px",
  },
};