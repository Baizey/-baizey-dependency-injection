import 'jest'
import { TransientLifetime } from '../../src/Lifetime/TransientLifetime'
import { Lifetime, propertyOfLifetime, Provider, UUID } from '../testUtils'

describe( propertyOfLifetime.provide, () => {
  test( 'Never returns the same, even if same context', () => {
    const sut = Lifetime( TransientLifetime )
    const provider = Provider()

    const expected = sut.provide( provider, {} as any )
    const actual = sut.provide( provider, {} as any )

    expect( expected ).not.toEqual( actual )
  } )

  test( 'Ignores anything in scoped', () => {
    const notExpected = UUID.randomUUID()
    const provider = Provider()
    const sut = Lifetime( TransientLifetime )
    provider.instances[sut.name] = notExpected
    const scope = { instances: { [sut.name]: notExpected }, }

    const actual = sut.provide( provider, scope as any )

    expect( actual ).not.toEqual( notExpected )
  } )
} )

describe( propertyOfLifetime.isSingleton, () => {
  test( 'should be false', () => expect( Lifetime( TransientLifetime ).isSingleton ).toBeFalsy() )
} )