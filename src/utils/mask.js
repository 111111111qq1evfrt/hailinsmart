export function maskIdCard(idCard) {
  if (!idCard) return ''
  if (idCard.length === 18) {
    return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
  }
  return idCard
}

export function maskPhone(phone) {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

export function maskName(name) {
  if (!name) return ''
  if (name.length === 1) {
    return name
  }
  return name.replace(/^(.)(.*)$/, '$1' + '*'.repeat(name.length - 1))
}

export function maskEmail(email) {
  if (!email) return ''
  const match = email.match(/^(.{1})(.*)@(.+)$/)
  if (match) {
    return match[1] + '***@' + match[3]
  }
  return email
}