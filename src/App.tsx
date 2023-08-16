import "bootstrap/dist/css/bootstrap.min.css";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";

import HeadMatter from "./components/HeadMatter";

import "./App.css";

export default function App() {
  return (
    <>
      <Container>
        <Row>
          <HeadMatter />
        </Row>
      </Container>
    </>
  );
}
