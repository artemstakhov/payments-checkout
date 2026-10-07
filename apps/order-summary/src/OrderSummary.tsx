import styled from 'styled-components';

const Wrapper = styled.div`
  font-family: sans-serif;
  padding: 1rem;
  border: 1px solid #ccc;
`;

export function OrderSummary(): JSX.Element {
  return <Wrapper>Order summary (remote)</Wrapper>;
}
