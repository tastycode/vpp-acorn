"use client";

import CountryMap from '@/app/components/CountryMap';
import { StateData } from '@/app/counties/types';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getCommonServerSideProps } from '@/pages';



interface StatePageProps {
    stateData: StateData
}
export const getStateServerSideProps: GetServerSideProps = async (context) => {
    const commonProps = await getCommonServerSideProps();
    const { initialStatesData } = commonProps.props as { initialStatesData: StateData[]; };
    const { state } = context.params as { state: string; };
    const stateData = initialStatesData.find(stateData => stateData.code === state);

    // Fetch data for the specified county from an API

    return { props: { stateData, initialStatesData } };
}
export const getServerSideProps: GetServerSideProps = async (context) => {
    return getStateServerSideProps(context);
};

const StatePage: React.FC<StatePageProps> = ({ stateData }) => {
    const router = useRouter();
    const { state } = router.query as { state: string; };

    return (
        <div>
            <h1>State: {state}</h1>
            <CountryMap focusOn={{state}}/>

            <pre>
                {JSON.stringify(stateData, null, 2)}
            </pre>
            {/* Add other relevant data and structure */}
        </div>
    );
};

export default StatePage;
