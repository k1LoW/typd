const { gatherInputData } = require('../src/inputlib')

test('gatherInputData', () => {
  document.body.innerHTML = `
    <input type="text" name="k" value="val">
    <input type="text" value="val2">
    <select name="k2">
      <option value="val3"></option>
      <option value="val4" selected></option>
      <option value="val5"></option>
    </select>
    <input type="radio" name="k3" value="val6">
    <input type="radio" name="k3" value="val7" checked>
    <input type="checkbox" name="k4" value="val8">
    <input type="checkbox" name="k4" value="val9" checked>
    <input type="checkbox" name="k4" value="val10" checked>
    <textarea name="k5">val11</textarea>
    <input type="submit" name="k6" value="val12">
    <input type="hidden" name="k7" value="val13">
    <input type="password" name="k8" value="val14">
  `

  const data = gatherInputData()
  expect(data).toEqual({
    k: 'val',
    k2: 'val4',
    k3: [null, 'val7'],
    k4: [false, true, true],
    k5: 'val11',
    k7: 'val13',
    k8: 'val14'
  })
})
