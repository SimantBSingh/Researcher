import { css } from "@emotion/react";

const styles = {
  container: css`
    margin: 0;
    padding: 0;
    min-height: 100vh;
    width: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `,
  headerContainer: css`
    width: 100%;
    display: flex;
    align-items: center;
    padding: 12px;
    background-color: #22272b;
    position: relative;
    box-sizing: border-box;

    @media (min-width: 768px) {
      padding: 20px;
    }
  `,
  drawerContainer: css`
    position: absolute;
    left: 12px;
    display: flex;
    align-items: center;
    z-index: 1;

    @media (min-width: 768px) {
      left: 20px;
    }
  `,
  contentContainer: css`
    flex: 1;
    width: 100%;
    overflow: auto;
    position: relative;
    box-sizing: border-box;
  `,
  header: css`
    margin: 0;
    color: #dee4ea;
    width: 100%;
    text-align: center;
    font-size: 1.5rem;

    @media (min-width: 768px) {
      font-size: 2rem;
    }

    @media (min-width: 1024px) {
      font-size: 2.5rem;
    }
  `,
};
