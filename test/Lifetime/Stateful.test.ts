import {
  CircularDependencyError,
  propertyOf,
  scoped,
  services,
  singleton,
  SingletonScopedDependencyError,
  stateful,
  Stateful,
  transient,
} from '../../src'
import { dummy, dummyClass } from '../testUtils'

const propertyOfStateful = propertyOf<Stateful<any, any>>()

class A {
}

class B { // noinspection JSUnusedLocalSymbols
  constructor(a: { a: A }, b: number) {
  }
}

class C {// noinspection JSUnusedLocalSymbols
  constructor(a: { a: A, c: Stateful<number, C> }, b: number) {
  }
}

describe(propertyOfStateful.create, () => {
  test('Stateful factory can depend on itself', () => {
    const { b } = services({
      a: singleton(A),
      aa: singleton(A),
      b: stateful(B),
      c: stateful(C),
    })
      .build().proxy
    expect(b.create(6)).toBeTruthy()
  })

  test('Using circular factory in constructor gives circular error', () => {
    const sut = dummy({
      circular: stateful(dummyClass(({ circular }) => circular.create())),
    })
      .build()
      .circular
    expect(() => sut.create())
      .toThrowError(new CircularDependencyError('circular@instance', ['circular@instance']))
  })

  test('Singleton dependency chain has scope restraints', () => {
    const sut = dummy({
      scoped: scoped(dummyClass()),
      stateful: stateful(dummyClass(({ stateful, scoped }) => ({ stateful, scoped }))),
      singleton: singleton(dummyClass(({ stateful }) => ({ stateful }))),
    })
      .build()
      .singleton

    expect(() => sut.stateful.create())
      .toThrowError(new SingletonScopedDependencyError('stateful@instance#1', 'scoped'))
  })

  test('Non-singleton dependency chain has no scope restraints', () => {
    const sut = dummy({
      scoped: scoped(dummyClass()),
      stateful: stateful(dummyClass(({ stateful, scoped }) => ({ stateful, scoped }))),
      transient: transient(dummyClass(({ stateful }) => ({ stateful }))),
    })
      .build()
      .transient
    expect(sut.stateful.create())
      .toBeTruthy()
  })

  test('nested creation of escaped stateful should be allowed', () => {
    const sut = dummy({
      stateful: stateful(dummyClass(({ stateful }) => ({ stateful }))),
      single: singleton(dummyClass(({ stateful }) => ({ stateful }))),
    })
      .build().single

    // This is foolishly looking, but we should be allowed to use stateful in escaped contexts pretty freely
    // So this should NOT throw a circular dependency error
    sut.stateful
      .create()
      .stateful
      .create()

    expect(true).toBeTruthy()
  })

})