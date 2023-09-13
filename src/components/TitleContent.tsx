import { Row } from "react-bootstrap";

export default function TitleContent() {
  return (
    <>
      <Row>
        <h1>Golf0ned's CS:GO Investment Tracker</h1>
      </Row>
      <Row>
        <div>Got tired of updating spreadsheet. Made web app to do thing.</div>
      </Row>
      <hr
        style={{
          background: "#adb5bd",
          height: "5px",
          border: "none",
        }}
      />
    </>
  );
}
