import React from 'react';

function Error({ statusCode }) {
  return (
    <p>
      {statusCode
        ? `服务器端发生错误 ${statusCode}`
        : '客户端发生错误'}
    </p>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;