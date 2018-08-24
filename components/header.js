import Link from 'next/link'

const linkStyle = {
  marginRight: 15
}

const Header = () => (
  <div>
      <Link href="/">
        <a style={linkStyle}>Home</a>
      </Link>
      <Link href="/about">
        <a style={linkStyle}>About</a>
      </Link>
      <Link href="/create">
        <a style={linkStyle}>Create</a>
      </Link>
      <Link href="/file/C5jJI5H7YKobzFy3dBsqbA">
        <a style={linkStyle}>Test</a>
      </Link>
  </div>
)

export default Header